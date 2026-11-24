#!/usr/bin/env node
// Regenerates docs/proof/: raw TAP test log, environment, deterministic fuzz results, CLI transcripts,
// a sealed sample audit report and SHA256SUMS. Everything is machine output from this host; nothing is hand-edited.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {init, ingest, approve, link, attest, revise} from '../packages/core/registry.mjs';
import {normalizeInput, parseMarkdown, makeRequirement} from '../packages/core/requirements.mjs';
import {verifyAudit} from '../packages/core/audit.mjs';
import {runAudit, writeAuditReports, auditHtml, auditMarkdown} from '../packages/core/assurance.mjs';
import {trace} from '../packages/core/trace.mjs';
import {htmlReport, markdownReport} from '../packages/core/reports.mjs';
import {IntentError, sha256} from '../packages/core/common.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'proof');
const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
const cli = path.join(ROOT, 'packages/cli/index.mjs');

// 1. Raw TAP test run
const testFiles = fs.readdirSync(path.join(ROOT, 'tests')).filter(f => f.endsWith('.test.mjs')).sort().map(f => path.join('tests', f));
const t = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...testFiles], {cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
// The docs test builds the site from the previous proof, so wipe docs/proof only after the test run.
fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});
fs.writeFileSync(path.join(OUT, 'test-run.tap'), t.stdout);
const num = k => Number(new RegExp(`^# ${k} (\\d+)`, 'm').exec(t.stdout)?.[1] ?? NaN);
const tests = num('tests'), pass = num('pass'), fail = num('fail'), skipped = num('skipped');

// 2. Deterministic fuzzing. Only IntentError is an acceptable failure mode.
let seed = 20261122;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
const pick = a => a[Math.floor(rnd() * a.length)];
const junk = () => pick([null, undefined, 0, -1, 1e999, NaN, '', ' ', 'x'.repeat(5000), '<script>alert(1)</script>', '[a](javascript:x)', '../../etc/passwd', '\u0000', true, [], {}, [[]], {a: {b: [1, 2, {c: null}]}}, '"; DROP TABLE', '${7*7}', '‮', 'sk-' + 'A'.repeat(30), 'REQ-' + 'Z'.repeat(60)]);
const fuzz = {schema: 'intentsutra.fuzz.v1', seed: 20261122, requirementCases: 0, accepted: 0, refused: 0, markdownCases: 0, importCases: 0, importRefused: 0, auditTamperCases: 0, auditTamperUndetected: 0, rendererCases: 0, rendererEscapeFailures: 0, unexpectedExceptions: 0, notes: []};
const note = e => { fuzz.unexpectedExceptions++; if (fuzz.notes.length < 5) fuzz.notes.push(String(e && e.message).slice(0, 120)); };
const fields = ['id', 'title', 'actor', 'trigger', 'behavior', 'constraints', 'acceptance'];
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'fixtures/team-invitations.json'), 'utf8'))[0];
for (let i = 0; i < 3000; i++) {
  const r = structuredClone(base);
  for (let k = 0, n = 1 + Math.floor(rnd() * 3); k < n; k++) r[pick(fields)] = junk();
  fuzz.requirementCases++;
  try { makeRequirement(normalizeInput(r), typeof r.id === 'string' ? r.id : undefined); fuzz.accepted++; }
  catch (e) { if (e instanceof IntentError) fuzz.refused++; else note(e); }
}
for (let i = 0; i < 1500; i++) {
  fuzz.markdownCases++;
  try { parseMarkdown(Array.from({length: 1 + Math.floor(rnd() * 8)}, () => pick(['# T', '## Actor', '## Acceptance', '- x', 'text', '###### deep', String(junk()), '\r\n', '| a | b |'])).join('\n')); }
  catch (e) { if (!(e instanceof IntentError)) note(e); }
}
const ws = fs.mkdtempSync(path.join(os.tmpdir(), 'intsut-fuzz-'));
try {
  init(ws);
  for (let i = 0; i < 300; i++) {
    fuzz.importCases++;
    const body = pick([JSON.stringify(junk()) ?? 'null', JSON.stringify([junk(), junk()]), JSON.stringify({requirements: junk()}), '{' + 'x'.repeat(Math.floor(rnd() * 50)), '', 'null', JSON.stringify([{...base, id: 'REQ-F' + String(i).padStart(3, '0')}])]);
    fs.writeFileSync(path.join(ws, 'in.json'), body ?? 'null');
    try { ingest(ws, 'in.json'); } catch (e) { if (e instanceof IntentError) fuzz.importRefused++; else note(e); }
  }
  fuzz.auditChainAfterImports = verifyAudit(path.join(ws, '.intentsutra', 'audit.jsonl')).valid;
  // audit-chain tamper detection: every single-character change must be detected
  const f = path.join(ws, '.intentsutra', 'audit.jsonl'), original = fs.readFileSync(f, 'utf8');
  for (let i = 0; i < 400; i++) {
    const pos = Math.floor(rnd() * original.length);
    if (original[pos] === '\n') continue;
    const repl = original[pos] === 'x' ? 'y' : 'x';
    fs.writeFileSync(f, original.slice(0, pos) + repl + original.slice(pos + 1));
    fuzz.auditTamperCases++;
    try { if (verifyAudit(f).valid) fuzz.auditTamperUndetected++; } catch (e) { note(e); }
  }
  fs.writeFileSync(f, original);
} finally { fs.rmSync(ws, {recursive: true, force: true}); }
for (let i = 0; i < 200; i++) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'intsut-fuzz-r-'));
  try {
    init(d);
    const title = pick(['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', '[x](javascript:alert(1))', '|| injected |', '`x`', '<svg/onload=alert(1)>']);
    fs.writeFileSync(path.join(d, 'r.json'), JSON.stringify([{...base, id: 'REQ-R' + String(i).padStart(3, '0'), title}]));
    ingest(d, 'r.json');
    const rep = trace(d), a = runAudit(d);
    fuzz.rendererCases++;
    if (/<img src=x|<script>alert|<svg\/onload/.test(htmlReport(rep) + auditHtml(a))) fuzz.rendererEscapeFailures++;
    markdownReport(rep); auditMarkdown(a);
  } catch (e) { fuzz.rendererEscapeFailures++; note(e); } finally { fs.rmSync(d, {recursive: true, force: true}); }
}
fs.writeFileSync(path.join(OUT, 'fuzz-results.json'), JSON.stringify(fuzz, null, 2) + '\n');

// 3. Scripted lifecycle through the real CLI: transcripts include refusals
const demo = fs.mkdtempSync(path.join(os.tmpdir(), 'intsut-proof-'));
fs.copyFileSync(path.join(ROOT, 'fixtures/team-invitations.json'), path.join(demo, 'team-invitations.json'));
fs.writeFileSync(path.join(demo, 'impl.js'), '// synthetic implementation reference\n');
fs.writeFileSync(path.join(demo, 'run-log.txt'), 'synthetic imported test-run log: 12 passed\n');
fs.writeFileSync(path.join(demo, 'release-note.txt'), 'synthetic imported release note\n');
fs.writeFileSync(path.join(demo, 'v2.json'), JSON.stringify([{...base, behavior: 'Invitation expires after 7 days and can be revoked by an owner'}]));
const sh = (name, args) => { const r = spawnSync(process.execPath, [cli, ...args], {cwd: demo, encoding: 'utf8'}); fs.writeFileSync(path.join(OUT, `cli-${name}.txt`), `$ intentsutra ${args.join(' ')}\n${r.stdout}${r.stderr ? '\n[stderr]\n' + r.stderr : ''}\n[exit ${r.status}]\n`); return r; };
const id = base.id;
sh('version', ['--version']);
sh('doctor', ['doctor']);
sh('init', ['init']);
sh('ingest', ['ingest', '--file', 'team-invitations.json']);
sh('refusal-attest-without-evidence', ['attest', '--id', id, '--revision', '1', '--reviewer', 'Asha', '--note', 'looks done', '--confirm-human']);
sh('refusal-approve-without-confirmation', ['approve', '--id', id, '--revision', '1', '--reviewer', 'Asha', '--note', 'ok']);
sh('approve', ['approve', '--id', id, '--revision', '1', '--reviewer', 'Asha', '--note', 'Reviewed acceptance with product owner', '--confirm-human']);
sh('link-code', ['link', '--id', id, '--revision', '1', '--kind', 'code', '--ref', 'impl.js']);
sh('link-test-run', ['link', '--id', id, '--revision', '1', '--kind', 'test-run', '--ref', 'run-log.txt', '--outcome', 'passed']);
sh('link-release', ['link', '--id', id, '--revision', '1', '--kind', 'release', '--ref', 'release-note.txt', '--outcome', 'released']);
sh('attest', ['attest', '--id', id, '--revision', '1', '--reviewer', 'Asha', '--note', 'Evidence reviewed by hand', '--confirm-human']);
sh('revise', ['revise', '--id', id, '--revision', '1', '--file', 'v2.json']);
sh('refusal-link-old-revision', ['link', '--id', id, '--revision', '1', '--kind', 'code', '--ref', 'impl.js']);
sh('impact', ['impact', '--id', id]);
sh('trace-after-revision', ['trace']);
const aud = sh('audit', ['audit', '--out', 'audit-sample']);
sh('verify', ['verify', '--report', 'audit-sample/audit-report.json']);
sh('refusal-path-traversal', ['ingest', '--file', '../outside.json']);
sh('refusal-unknown-host', ['install-ide', '--host', '../x', '--target', path.join(demo, 'ide')]);
const sample = path.join(OUT, 'audit-sample');
fs.cpSync(path.join(demo, 'audit-sample'), sample, {recursive: true});
const auditReport = JSON.parse(fs.readFileSync(path.join(sample, 'audit-report.json'), 'utf8'));
// Negative sample: the same workspace with a silently forged approval must FAIL the audit
const regFile = path.join(demo, '.intentsutra', 'requirements.json');
const reg = JSON.parse(fs.readFileSync(regFile, 'utf8'));
reg.requirements[0].approvals.push({revision: reg.requirements[0].revision, reviewer: 'Forger', note: 'silent edit', time: new Date().toISOString(), kind: 'local-self-attested-approval', identityVerified: false});
fs.writeFileSync(regFile, JSON.stringify(reg, null, 2));
writeAuditReports(demo, 'audit-sample-forged');
fs.cpSync(path.join(demo, 'audit-sample-forged'), path.join(OUT, 'audit-sample-forged'), {recursive: true});
const forged = JSON.parse(fs.readFileSync(path.join(OUT, 'audit-sample-forged', 'audit-report.json'), 'utf8'));
fs.rmSync(demo, {recursive: true, force: true});

// 4. Environment + sums
const env = {version: VERSION, node: process.version, platform: `${process.platform}/${process.arch}`, os: `${os.type()} ${os.release()}`, recordedAt: new Date().toISOString(), tests, pass, fail, skipped,
  auditChecks: auditReport.summary.checks, auditPassed: auditReport.summary.passed, auditFailed: auditReport.summary.failed, verdict: auditReport.verdict, forgedVerdict: forged.verdict,
  fuzzCases: fuzz.requirementCases + fuzz.markdownCases + fuzz.importCases + fuzz.auditTamperCases + fuzz.rendererCases,
  fuzzFailures: fuzz.unexpectedExceptions + fuzz.auditTamperUndetected + fuzz.rendererEscapeFailures};
fs.writeFileSync(path.join(OUT, 'environment.json'), JSON.stringify(env, null, 2) + '\n');
const sums = [];
const walk = d => { for (const e of fs.readdirSync(d, {withFileTypes: true})) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name !== 'SHA256SUMS.txt') sums.push(`${sha256(fs.readFileSync(p))}  ${path.relative(OUT, p).split(path.sep).join('/')}`); } };
walk(OUT);
fs.writeFileSync(path.join(OUT, 'SHA256SUMS.txt'), sums.sort((a, b) => a.split('  ')[1].localeCompare(b.split('  ')[1])).join('\n') + '\n');
fs.writeFileSync(path.join(OUT, 'README.md'), `# Proof artifacts

Machine-generated by \`npm run proof\` on ${env.recordedAt} (Node ${env.node}, ${env.platform}). Nothing here is hand-edited.

| File | What it is |
|---|---|
| test-run.tap | Raw TAP output of the full suite (${tests} tests, ${pass} passed, ${fail} failed, ${skipped} skipped) |
| fuzz-results.json | Deterministic fuzzing: ${fuzz.requirementCases} requirement records, ${fuzz.markdownCases} Markdown inputs, ${fuzz.importCases} hostile imports, ${fuzz.auditTamperCases} audit-chain byte edits, ${fuzz.rendererCases} injection renders |
| cli-*.txt | Real stdout/stderr and exit codes of a full scripted lifecycle, including refusals |
| audit-sample/ | Sealed audit report (JSON, Markdown, HTML) of the honest lifecycle: verdict ${auditReport.verdict} |
| audit-sample-forged/ | Same workspace after a silent registry edit: verdict ${forged.verdict}. Shows the audit detects forgery |
| environment.json | Versions and counts for this run |
| SHA256SUMS.txt | Digests of every file above (detects change; not a signature) |

Verify: \`sha256sum -c SHA256SUMS.txt\` inside this folder, and \`intentsutra verify --report audit-sample/audit-report.json\`.

These results show the code behaved as listed on this host. They do not prove compliance, that any product is correct, or behavior on other hosts.
`);
console.log(JSON.stringify({tests, pass, fail, skipped, fuzz: {cases: env.fuzzCases, failures: env.fuzzFailures, notes: fuzz.notes}, audit: auditReport.verdict, forged: forged.verdict}, null, 2));
if (fail || env.fuzzFailures || forged.verdict !== 'FAIL' || auditReport.verdict === 'FAIL') process.exitCode = 2;
