// Independent audit: re-derives every claim from raw state and reports findings.
// It never trusts registry-derived labels; it recomputes hashes, states and registry/audit consistency.
import fs from 'node:fs';
import path from 'node:path';
import {load} from './registry.mjs';
import {verifyAudit} from './audit.mjs';
import {traceRequirement} from './trace.mjs';
import {hashObject, sha256, canonical, escapeHtml, writeTextAtomic, now, IntentError, readFileBounded} from './common.mjs';

export const AUDIT_SCHEMA_VERSION = '1.0';
const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'];
const CONTENT_KEYS = ['title', 'actor', 'trigger', 'behavior', 'constraints', 'acceptance', 'sourceNote'];
const md = s => String(s ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');

function readEvents(file) {
  if (!fs.existsSync(file)) return [];
  return readFileBounded(file, 50 * 1024 * 1024).split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}

export function runAudit(workspace) {
  const {s, reg} = load(workspace);
  const chain = verifyAudit(s.audit);
  let events = [];
  try { events = chain.valid ? readEvents(s.audit) : []; } catch { /* chain already reported invalid */ }
  const rows = reg.requirements.map(r => ({r, t: traceRequirement(r, s.root)}));
  const checks = [];
  const add = (id, title, severity, failures, passNote, limitation = '') => checks.push({
    id, title, severity, status: failures.length ? 'fail' : 'pass', failures,
    note: failures.length ? `${failures.length} violation(s)` : passNote, limitation
  });

  add('AUD-01', 'Audit hash chain is intact', 'critical', chain.valid ? [] : [chain.error ?? 'chain invalid'],
    `${chain.count} event(s) chain-verified from GENESIS`,
    'A local hash chain detects edits and mid-file deletion, not truncation of the newest events or a full rewrite by someone with write access.');

  add('AUD-02', 'Requirement content hashes match their recorded fields', 'high',
    reg.requirements.filter(r => hashObject(Object.fromEntries(CONTENT_KEYS.map(k => [k, r[k]]))) !== r.contentHash).map(r => `${r.id} rev ${r.revision}: contentHash does not match stored content`),
    `${reg.requirements.length} requirement(s) re-hashed`);

  const driftNeedles = ['hash-mismatch', 'missing-or-unsafe'];
  add('AUD-03', 'Current-revision evidence files still match their recorded SHA-256', 'high',
    rows.flatMap(({r, t}) => t.currentEvidence.filter(e => driftNeedles.includes(e.integrity)).map(e => `${r.id}: ${e.kind} ${e.ref} is ${e.integrity}`)),
    'No evidence drift detected',
    'A hash match proves the file is unchanged since linking; it does not prove the file demonstrates the requirement.');

  const recomputed = ({r, t}) => {
    const cur = t.currentEvidence;
    const ok = l => !l.sha256 || l.integrity === 'hash-match';
    return r.approvals.some(a => a.revision === r.revision) && cur.some(l => l.kind === 'code' && ok(l)) &&
      cur.some(l => l.kind === 'test-run' && l.outcome === 'passed' && ok(l)) && cur.some(l => l.kind === 'release' && l.outcome === 'released' && ok(l));
  };
  add('AUD-04', 'No false completion: every attested requirement has current approval, code, passed test-run and release evidence', 'critical',
    rows.filter(x => x.t.state === 'human-attested-evidence-linked' && !recomputed(x)).map(({r}) => `${r.id} shows attested but evidence is incomplete or drifted`),
    `${rows.filter(x => x.t.state === 'human-attested-evidence-linked').length} attested requirement(s) re-derived`);

  add('AUD-05', 'Approvals and attestations are bound to a valid revision', 'high',
    reg.requirements.flatMap(r => [...r.approvals, ...(r.attestations ?? [])].filter(a => !Number.isInteger(a.revision) || a.revision < 1 || a.revision > r.revision).map(a => `${r.id}: entry for impossible revision ${a.revision}`)),
    'All approvals/attestations reference existing revisions');

  add('AUD-06', 'Imported test and release claims keep their "not independently verified" label', 'high',
    reg.requirements.flatMap(r => r.links.filter(l => ['test-run', 'release'].includes(l.kind) && !/not-independently-verified/.test(l.provenance ?? '')).map(l => `${r.id}: ${l.kind} link lost its unverified label (${l.provenance})`)),
    'No imported claim has been upgraded');

  add('AUD-07', 'Approvals never claim a verified identity', 'high',
    reg.requirements.flatMap(r => [...r.approvals, ...(r.attestations ?? [])].filter(a => a.identityVerified !== false).map(a => `${r.id}: entry claims identityVerified=${a.identityVerified}`)),
    'All approvals are explicitly self-attested');

  // Registry/audit consistency: every mutation must have left an audit event.
  const count = (action, id, pick = d => d.id) => events.filter(e => e.action === action && pick(e.details ?? {}) === id).length;
  const consistency = [];
  if (chain.valid) for (const r of reg.requirements) {
    const exp = {
      approvals: [count('requirement.approval-self-attested', r.id), r.approvals.length],
      links: [count('evidence.linked', r.id), r.links.length],
      attestations: [count('requirement.human-attested', r.id), (r.attestations ?? []).length],
      revisions: [count('requirement.revised', r.id), r.revision - 1]
    };
    for (const [k, [ev, st]] of Object.entries(exp)) if (ev !== st) consistency.push(`${r.id}: registry has ${st} ${k} but audit log records ${ev}`);
    if (!events.some(e => e.action === 'requirements.ingested' && (e.details?.added ?? []).includes(r.id))) consistency.push(`${r.id}: no ingest event in audit log`);
  }
  add('AUD-08', 'Registry state is explained by the audit log (no silent edits)', 'critical', chain.valid ? consistency : ['skipped: audit chain invalid'],
    'Every approval, link, attestation and revision has a matching audit event',
    'Consistency is checked by counts per requirement, not by cryptographic binding of each registry field.');

  add('AUD-09', 'Source files are classified untrusted and hash-pinned', 'medium',
    reg.requirements.filter(r => !r.source || r.source.trust !== 'untrusted-input' || !/^[0-9a-f]{64}$/.test(r.source.sha256 ?? '')).map(r => `${r.id}: source provenance missing or mislabeled`),
    'All sources carry untrusted-input label and SHA-256');

  add('AUD-10', 'Stale evidence is visible, not silently reused', 'info',
    [], `${rows.reduce((a, x) => a + x.t.staleEvidenceCount, 0)} stale link(s) preserved as history across ${rows.filter(x => x.t.staleEvidenceCount).length} requirement(s)`);

  const gaps = [];
  for (const {r, t} of rows) {
    if (t.coverage.testFileObserved && !t.coverage.importedTestPass) gaps.push(`${r.id}: test file referenced but no imported passed test-run (a test file is not a test pass)`);
    if (t.coverage.ticketOrPrReferences && !t.coverage.codeObserved) gaps.push(`${r.id}: ticket/PR reference without observed code (a pointer is not proof)`);
    if (t.approval === 'self-attested' && t.unansweredQuestions.length) gaps.push(`${r.id}: approved with ${t.unansweredQuestions.length} unanswered question(s)`);
  }
  add('AUD-11', 'Evidence gaps and proof-by-proxy risks', 'medium', gaps, 'No proof-by-proxy gaps found');

  const failed = checks.filter(c => c.status === 'fail');
  const sev = Object.fromEntries(SEVERITY_ORDER.map(k => [k, failed.filter(c => c.severity === k).length]));
  const verdict = sev.critical || sev.high ? 'FAIL' : sev.medium || sev.low ? 'PASS-WITH-FINDINGS' : 'PASS';
  const report = {
    schemaVersion: AUDIT_SCHEMA_VERSION,
    tool: 'intentsutra-ai',
    generatedAt: now(),
    projectId: reg.projectId,
    verdict,
    summary: {requirements: rows.length, checks: checks.length, passed: checks.length - failed.length, failed: failed.length, bySeverity: sev,
      attested: rows.filter(x => x.t.state === 'human-attested-evidence-linked').length, auditEvents: chain.count, auditChainHead: chain.lastHash ?? null},
    checks,
    requirements: rows.map(({r, t}) => ({id: r.id, revision: r.revision, state: t.state, contentHash: r.contentHash, staleEvidence: t.staleEvidenceCount, openQuestions: t.unansweredQuestions.length})),
    limitations: [
      'Local reviewer identity is self-attested; there is no SSO or signature.',
      'Imported test-run and release outcomes are user-supplied claims; this tool never executes tests.',
      'The audit chain is tamper-evident for edits, not tamper-proof against a full rewrite.',
      'Secret redaction is heuristic. A PASS verdict is not a certification, legal opinion or proof that software is correct.'
    ]
  };
  report.seal = sha256(canonical({...report, seal: undefined}));
  return report;
}

export function verifyAuditReport(report) {
  if (!report || report.schemaVersion !== AUDIT_SCHEMA_VERSION || typeof report.seal !== 'string') return {valid: false, error: 'Not an IntentSutra audit report'};
  const {seal, ...rest} = report;
  const expected = sha256(canonical({...rest, seal: undefined}));
  return expected === seal ? {valid: true, seal, verdict: report.verdict} : {valid: false, error: 'Seal mismatch: report was modified after generation'};
}

export function auditMarkdown(a) {
  const L = ['# IntentSutra AI — Independent Audit Report', '',
    `**Verdict: ${a.verdict}** · Project \`${a.projectId}\` · Generated ${a.generatedAt}`, '',
    `Seal (SHA-256): \`${a.seal}\``, '',
    `Requirements ${a.summary.requirements} · Checks ${a.summary.checks} · Passed ${a.summary.passed} · Failed ${a.summary.failed} · Audit events ${a.summary.auditEvents} · Human-attested ${a.summary.attested}`, '',
    '> This is an evidence-integrity review. It is not a certification, a compliance opinion or proof that any requirement is implemented.', '',
    '## Checks', '', '| ID | Check | Severity | Result | Detail |', '| --- | --- | --- | --- | --- |'];
  for (const c of a.checks) L.push(`| ${c.id} | ${md(c.title)} | ${c.severity} | ${c.status.toUpperCase()} | ${md(c.note)} |`);
  const bad = a.checks.filter(c => c.status === 'fail');
  L.push('', '## Findings', '');
  if (!bad.length) L.push('No findings.');
  for (const c of bad) { L.push(`### ${c.id} — ${md(c.title)} (${c.severity})`, ''); for (const f of c.failures) L.push(`- ${md(f)}`); L.push(''); }
  L.push('## Requirements', '', '| ID | Rev | State | Stale links | Open questions |', '| --- | ---: | --- | ---: | ---: |');
  for (const r of a.requirements) L.push(`| ${md(r.id)} | ${r.revision} | ${md(r.state)} | ${r.staleEvidence} | ${r.openQuestions} |`);
  L.push('', '## Limitations', ''); for (const x of a.limitations) L.push(`- ${x}`);
  const lim = a.checks.filter(c => c.limitation); if (lim.length) { L.push('', '### Per-check limits', ''); for (const c of lim) L.push(`- ${c.id}: ${md(c.limitation)}`); }
  return L.join('\n') + '\n';
}

export function auditHtml(a) {
  const e = escapeHtml, cls = v => v === 'FAIL' ? 'bad' : v === 'PASS' ? 'ok' : 'warn';
  const rows = a.checks.map(c => `<tr><th scope="row"><code>${e(c.id)}</code></th><td>${e(c.title)}</td><td>${e(c.severity)}</td><td class="${c.status === 'pass' ? 'ok' : 'bad'}">${c.status === 'pass' ? '✔ PASS' : '✖ FAIL'}</td><td>${e(c.note)}</td></tr>`).join('');
  const bad = a.checks.filter(c => c.status === 'fail').map(c => `<section><h3>${e(c.id)} · ${e(c.title)} <small>(${e(c.severity)})</small></h3><ul>${c.failures.map(f => `<li>${e(f)}</li>`).join('')}</ul></section>`).join('') || '<p>No findings.</p>';
  const reqs = a.requirements.map(r => `<tr><td><code>${e(r.id)}</code></td><td>${r.revision}</td><td>${e(r.state)}</td><td>${r.staleEvidence}</td><td>${r.openQuestions}</td></tr>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>IntentSutra AI — Audit Report</title><style>:root{color-scheme:light dark;--bg:#f6f9fc;--fg:#14283a;--card:#fff;--line:#d5e0e9;--ok:#0a6b3a;--bad:#b3261e;--warn:#8a5a00}@media(prefers-color-scheme:dark){:root{--bg:#0e1a26;--fg:#e6eef5;--card:#15273a;--line:#2a4056;--ok:#4cd08a;--bad:#ff8a80;--warn:#f2c14e}}body{font:16px/1.55 system-ui,Segoe UI,Arial,sans-serif;background:var(--bg);color:var(--fg);max-width:1100px;margin:auto;padding:1.5rem}header,main{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:1.4rem;margin-bottom:1.2rem}h1{margin:.2rem 0}.verdict{display:inline-block;font-weight:700;padding:.3rem .9rem;border-radius:999px;border:2px solid currentColor}.ok{color:var(--ok)}.bad{color:var(--bad)}.warn{color:var(--warn)}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid var(--line);padding:.55rem;text-align:left;vertical-align:top}.wrap{overflow-x:auto}code{overflow-wrap:anywhere}.note{border-left:4px solid var(--warn);padding:.6rem 1rem;background:color-mix(in srgb,var(--warn) 12%,transparent)}:focus-visible{outline:3px solid #2a7de1;outline-offset:2px}@media print{body{background:#fff;color:#000}}</style></head><body><header><p>IntentSutra AI · by Vatsal Shah</p><h1>Independent Audit Report</h1><p><span class="verdict ${cls(a.verdict)}">${e(a.verdict)}</span></p><p>Project <code>${e(a.projectId)}</code> · ${e(a.generatedAt)}</p><p>Seal SHA-256: <code>${e(a.seal)}</code></p><p>${a.summary.requirements} requirements · ${a.summary.passed}/${a.summary.checks} checks passed · ${a.summary.auditEvents} audit events · ${a.summary.attested} human-attested</p></header><main><p class="note">Evidence-integrity review only — not a certification, compliance opinion, or proof that any requirement is implemented.</p><h2>Checks</h2><div class="wrap" role="region" aria-label="Audit checks" tabindex="0"><table><thead><tr><th scope="col">ID</th><th scope="col">Check</th><th scope="col">Severity</th><th scope="col">Result</th><th scope="col">Detail</th></tr></thead><tbody>${rows}</tbody></table></div><h2>Findings</h2>${bad}<h2>Requirements</h2><div class="wrap" role="region" aria-label="Requirements" tabindex="0"><table><thead><tr><th scope="col">ID</th><th scope="col">Rev</th><th scope="col">State</th><th scope="col">Stale links</th><th scope="col">Open questions</th></tr></thead><tbody>${reqs}</tbody></table></div><h2>Limitations</h2><ul>${a.limitations.map(x => `<li>${e(x)}</li>`).join('')}</ul></main></body></html>`;
}

export function writeAuditReports(workspace, outDir) {
  const {s} = load(workspace);
  const target = path.resolve(s.root, outDir ?? path.join('.intentsutra', 'reports'));
  if (target !== s.root && !target.startsWith(s.root + path.sep)) throw new IntentError('Report path outside workspace', 'PATH_ESCAPE');
  for (let p = target; p !== s.root && p.startsWith(s.root + path.sep); p = path.dirname(p)) {
    if (fs.existsSync(p) && fs.lstatSync(p).isSymbolicLink()) throw new IntentError('Symlink report directory refused', 'UNSAFE_OUTPUT');
  }
  fs.mkdirSync(target, {recursive: true});
  const report = runAudit(workspace);
  const files = {json: path.join(target, 'audit-report.json'), markdown: path.join(target, 'audit-report.md'), html: path.join(target, 'audit-report.html')};
  writeTextAtomic(files.json, JSON.stringify(report, null, 2) + '\n');
  writeTextAtomic(files.markdown, auditMarkdown(report));
  writeTextAtomic(files.html, auditHtml(report));
  return {report, files};
}
