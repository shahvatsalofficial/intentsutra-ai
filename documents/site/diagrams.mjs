// Theme-aware inline SVG diagrams. Colours come from CSS variables in site.css, so one SVG serves light and dark.
let uid = 0;
const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (w, h, label, body) => {
  const id = `ah${++uid}`;
  return `<div class="dia-scroll"><svg class="dia" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(label)}"><defs><marker id="${id}" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path class="ah" d="M0,0 L9,4.5 L0,9 z"/></marker></defs>${body.replaceAll('#AH', `url(#${id})`)}</svg></div>`;
};
const box = (x, y, w, h, t1, t2 = '', cls = '') => `<rect class="bx ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/><text class="t1" x="${x + w / 2}" y="${y + (t2 ? h / 2 - 3 : h / 2 + 5)}" text-anchor="middle">${e(t1)}</text>${t2 ? `<text class="t2" x="${x + w / 2}" y="${y + h / 2 + 15}" text-anchor="middle">${e(t2)}</text>` : ''}`;
const arrow = (d, dash = false) => `<path class="ln${dash ? ' dash' : ''}" d="${d}" marker-end="#AH"/>`;
const txt = (x, y, s, cls = 't2', anchor = 'middle') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}">${e(s)}</text>`;
const diamond = (cx, cy, w, h, t, cls = '') => `<polygon class="bx ${cls}" points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}"/>${txt(cx, cy + 4, t, 't1')}`;

export const DIAGRAMS = {
  pipeline: () => svg(780, 200, 'Pipeline: a rough request is imported, questions and draft acceptance are generated, a human approves an exact revision, evidence is linked to that revision, a human attests, and an independent audit writes JSON, Markdown and HTML reports.',
    box(8, 60, 112, 70, 'Import', 'rough request') + box(140, 60, 112, 70, 'Questions', 'unknowns listed', 'warn') + box(272, 60, 112, 70, 'Approve', 'human, exact rev', 'br') + box(404, 60, 112, 70, 'Link evidence', 'hashed, rev-bound') + box(536, 60, 112, 70, 'Attest', 'human reviews', 'br') + box(668, 60, 104, 70, 'Audit', 'sealed reports', 'ok') +
    arrow('M120 95 H140') + arrow('M252 95 H272') + arrow('M384 95 H404') + arrow('M516 95 H536') + arrow('M648 95 H668') +
    txt(390, 28, 'every step is appended to a hash-chained audit log', 't2') + txt(390, 170, 'a change at any point creates a new revision and makes earlier approvals and evidence stale', 't2')),

  lifecycle: () => svg(780, 290, 'State flow: needs-stakeholder-approval, then approved-unverified, then partial-evidence, then human-review-required, then human-attested-evidence-linked. A revision sends the requirement back to needs-stakeholder-approval and marks earlier approvals and evidence stale. There is no completed state.',
    box(8, 20, 140, 60, 'needs approval', 'no approval yet', 'warn') + box(168, 20, 140, 60, 'approved', 'unverified') + box(328, 20, 140, 60, 'partial evidence', 'some links') + box(488, 20, 140, 60, 'review required', 'code + pass + release', 'br') + box(648, 20, 124, 60, 'attested', 'human reviewed', 'ok') +
    arrow('M148 50 H168') + arrow('M308 50 H328') + arrow('M468 50 H488') + arrow('M628 50 H648') +
    box(238, 160, 300, 56, 'Revise the requirement', 'content hash changes, revision +1', 'bad') + arrow('M718 80 V188 H538', true) + arrow('M238 188 H78 V80', true) +
    txt(390, 248, 'Earlier approvals, links and attestations stay as history, marked stale.', 't2') + txt(390, 270, 'There is deliberately no "completed" state.', 't1')),

  stale: () => svg(780, 250, 'Stale evidence: revision 1 has an approval and three evidence links. After a revision to revision 2, those entries are kept as history for revision 1 and no longer count; revision 2 starts with no approval and no evidence.',
    `<rect class="bx zone" x="8" y="14" width="360" height="220" rx="16"/>${txt(188, 40, 'REVISION 1', 'tb')}` + box(28, 56, 320, 40, 'Approval by Asha', 'self-attested', 'ok') + box(28, 106, 320, 40, 'Code link, test-run passed', 'hashed files') + box(28, 156, 320, 40, 'Release claim: released', 'imported, unverified') + txt(188, 218, 'counts only for revision 1', 't2') +
    `<rect class="bx zone" x="412" y="14" width="360" height="220" rx="16"/>${txt(592, 40, 'REVISION 2', 'tb')}` + box(432, 56, 320, 40, 'Approval needed again', 'none yet', 'warn') + box(432, 106, 320, 40, 'No current evidence', 'link to revision 2 only', 'warn') + box(432, 156, 320, 40, 'Old entries: stale history', 'visible, never promoted', 'bad') + txt(592, 218, 'starts clean; nothing carried over', 't2') +
    arrow('M368 124 H412') + txt(390, 112, 'revise', 't2')),

  trust: () => svg(780, 230, 'Trust boundaries: untrusted requirement text, issues and imported results go into the IntentSutra process, which has no network access and never runs tests or project code, and writes only to the .intentsutra folder and report folders you choose.',
    `<rect class="bx zone" x="8" y="20" width="220" height="190" rx="16"/>${txt(118, 44, 'UNTRUSTED INPUT', 't1')}${txt(118, 80, 'requirement Markdown / JSON')}${txt(118, 104, 'issue and PR text')}${txt(118, 128, 'imported test results')}${txt(118, 152, 'hostile text stays data', 't2')}` +
    `<rect class="bx br" x="280" y="20" width="240" height="190" rx="16"/>${txt(400, 44, 'INTENTSUTRA PROCESS', 'tb')}${txt(400, 80, 'no network calls')}${txt(400, 104, 'never runs tests or code')}${txt(400, 128, 'workspace-only regular files')}${txt(400, 152, 'size caps, symlinks refused', 't2')}${txt(400, 184, 'every change audited', 't2')}` +
    `<rect class="bx ok" x="572" y="20" width="200" height="190" rx="16"/>${txt(672, 44, 'OUTPUT (YOU CHOOSE)', 'tg')}${txt(672, 80, '.intentsutra/')}${txt(672, 104, 'traceability reports')}${txt(672, 128, 'audit-report .json')}${txt(672, 152, '.md  and  .html')}` +
    arrow('M228 115 H280') + arrow('M520 115 H572') + txt(400, 228, 'Blocked by design: network, shell, test execution, silent uploads', 't2')),

  audit: () => svg(780, 280, 'Independent audit: the registry, the audit log and the evidence files are read separately. The auditor recomputes hashes and cross-checks the registry against the log. If a registry entry has no matching audit event the verdict is FAIL; otherwise PASS or PASS with findings. The report is sealed with SHA-256.',
    box(10, 20, 150, 56, 'Registry', 'requirements.json') + box(10, 110, 150, 56, 'Audit log', 'audit.jsonl, hash chain') + box(10, 200, 150, 56, 'Evidence files', 'workspace files') +
    box(230, 100, 190, 76, 'Independent auditor', '11 checks, recomputes', 'br') +
    diamond(540, 138, 130, 96, 'Explained?') + box(640, 20, 130, 56, 'PASS', 'no failures', 'ok') + box(640, 100, 130, 76, 'FAIL', 'edit without a matching event', 'bad') + box(640, 200, 130, 56, 'Sealed report', 'JSON · MD · HTML', 'ok') +
    arrow('M160 48 C200 48 200 124 230 124') + arrow('M160 138 H230') + arrow('M160 228 C200 228 200 152 230 152') + arrow('M420 138 H475') + arrow('M540 90 V48 H640') + arrow('M605 138 H640') + arrow('M540 186 V228 H640') +
    txt(560, 64, 'yes', 't2', 'start') + txt(612, 130, 'no', 't2', 'start')),

  arch: () => svg(780, 330, 'Architecture: the CLI and the loopback server call the core modules. Core contains the registry, requirements parser, trace evaluator, reports, assurance auditor, audit chain and installer. Data is stored in .intentsutra.',
    box(180, 10, 180, 50, 'CLI', 'packages/cli', 'br') + box(420, 10, 180, 50, 'Server', 'loopback, read-only', 'br') +
    box(10, 120, 130, 56, 'registry', 'init, ingest, revise') + box(155, 120, 130, 56, 'requirements', 'parser, questions') + box(300, 120, 130, 56, 'trace', 'state, impact') + box(445, 120, 130, 56, 'reports', 'JSON · MD · HTML') + box(590, 120, 180, 56, 'assurance', '11 checks, seal', 'ok') +
    box(10, 230, 180, 50, 'audit chain', 'audit.jsonl', 'warn') + box(210, 230, 180, 50, 'common', 'hash, paths, redaction') + box(410, 230, 180, 50, 'installer', 'IDE instruction packs') + box(610, 230, 160, 50, '.intentsutra/', 'registry + log', 'zone') +
    arrow('M270 60 V90 H75 V120') + arrow('M270 60 V120') + arrow('M270 60 V90 H365 V120') + arrow('M270 60 V90 H510 V120') + arrow('M270 60 V90 H680 V120') + arrow('M510 60 V90') + arrow('M75 176 V230', true) + arrow('M365 176 V204 H300 V230', true) + arrow('M680 176 V230', true) +
    txt(390, 316, 'dependency direction: cli and server depend on core; core never depends on the CLI', 't2')),

  ci: () => svg(780, 250, 'CI gate: a pull request triggers intentsutra audit with the strict flag. A FAIL verdict exits with code 2 and blocks the merge; otherwise the merge is allowed. The sealed report is uploaded as an artifact either way.',
    box(10, 95, 120, 60, 'Pull request', 'opened or updated') + box(170, 95, 150, 60, 'CI job', 'intentsutra audit --strict', 'br') + diamond(420, 125, 130, 90, 'Verdict FAIL?') +
    box(550, 20, 130, 56, 'Exit 0', 'merge allowed', 'ok') + box(550, 172, 130, 56, 'Exit 2', 'merge blocked', 'bad') + box(696, 172, 78, 56, 'Fix', 'then push') +
    arrow('M130 125 H170') + arrow('M320 125 H355') + arrow('M420 80 V48 H550') + arrow('M420 170 V200 H550') + arrow('M680 200 H696') + arrow('M735 172 C735 130 250 130 245 155', true) +
    txt(450, 62, 'no', 't2', 'start') + txt(450, 192, 'yes', 't2', 'start') + txt(400, 246, 'audit-report.html, .md and .json attached as a CI artifact', 't2')),
};

/** Vertical flowchart as semantic HTML: reads well on phones, no horizontal scroll. */
export const FLOWS = {
  quickstart: { row: true, steps: [['Install', '`npx intentsutra-ai doctor`'], ['Import', '`intentsutra ingest --file brief.md`'], ['Approve', 'a named human, exact revision'], ['Audit', '`intentsutra audit --out audit-out`']] },
  vague: { steps: [
    ['Product owner writes: "Add team invitations with roles"', 'One line in a ticket. Everyone nods. Nobody has agreed on anything yet.'],
    ['`intentsutra ingest` imports it and assigns `REQ-…` with revision 1', 'The source file is hashed. The text is stored as untrusted data.'],
    ['`intentsutra review` lists what nobody said', 'Who may invite? Which roles? Can an admin invite another admin? What if the email bounces? Does an invite expire?', 'warn'],
    ['Five candidate scenarios appear, all marked **unapproved**', 'Placeholders such as `[TO CONFIRM]` stand where facts are missing. The tool never guesses policy.', ''],
    ['The team answers the questions in a revised file', '`intentsutra revise` creates revision 2 with the answers captured.', 'ok']] },
  stale: { steps: [
    ['Revision 1 is approved by Asha and shipped', 'Code, a test run and a release note are linked to revision 1.'],
    ['Product changes the rule: invitations now expire after 7 days', 'A new file is imported with `intentsutra revise --revision 1`.'],
    ['Revision 2 exists. The approval and links stay, but as **stale** history', '`intentsutra impact` lists exactly what no longer counts.', 'warn'],
    ['Someone tries to link old evidence to revision 1', 'Refused with `STALE_REVISION`. Evidence must match the current revision.', 'bad'],
    ['Asha re-approves revision 2 and new evidence is linked', 'Nothing is carried over silently.', 'ok']] },
  proxy: { steps: [
    ['A dashboard says "tests: 3 linked, PR merged"', 'It feels like the work is done.'],
    ['`intentsutra trace` shows 3 requirements with a test **file** and 0 with a passed run', 'A file in the repo shows the test exists, not that it passed.', 'warn'],
    ['The audit reports AUD-11 "proof-by-proxy gap"', 'Test file without a passed run, PR without observed code, approval with open questions.', 'bad'],
    ['The team links an actual run log and attaches the release note', 'The outcome is still labelled **imported, not independently verified**.', ''],
    ['A human attests; the state is `human-attested-evidence-linked`', 'Never "completed". A person still owns that claim.', 'ok']] },
  forged: { steps: [
    ['Someone edits `requirements.json` to add an approval for a risky requirement', 'No command was used, so no audit event was written.'],
    ['`intentsutra audit` recounts approvals, links and revisions against the log', 'The registry says 1 approval. The log records 0.', 'bad'],
    ['Finding AUD-08 fails with severity critical; verdict **FAIL**', 'With `--strict` the pipeline exits 2 and the release is blocked.', 'warn'],
    ['The team restores the registry and log from the same backup', 'Never delete log lines to make the audit pass.', 'ok']] },
  auditor: { steps: [
    ['An internal auditor asks: "show me how this requirement was approved"', 'They do not want a slide. They want the record.'],
    ['The team sends `audit-report.html` and `audit-report.json`', 'One file to read, one file for tooling. The report is sealed with SHA-256.'],
    ['The auditor runs `intentsutra verify --report audit-report.json`', 'If anyone edited the report afterwards, verification fails.', ''],
    ['The auditor reads the limits section', 'Identity is self-attested. Test results are imported claims. A hash chain is not a signature.', 'warn'],
    ['They decide whether more assurance is needed', 'For example Git with protected branches, or the planned signed-audit milestone.', 'ok']] },
  assistant: { steps: [
    ['A developer asks their AI assistant: "check our requirements before release"', 'The `intentsutra-prime` skill was copied in with `intentsutra install-ide --host claude`.'],
    ['The assistant runs the real CLI, not a guess', '`intentsutra trace` and `intentsutra audit --strict` return deterministic output.'],
    ['It reports gaps and drafts questions, and stops', 'It cannot approve, attest or mark anything complete. Those need a human and `--confirm-human`.', 'warn'],
    ['A person reviews and runs the approval themselves', 'The record shows who, which revision, and when.', 'ok']] },
  release: { steps: [
    ['Friday release review: 12 requirements are in scope', 'The manager runs `intentsutra audit --strict` in CI.'],
    ['Verdict **PASS-WITH-FINDINGS**: two approvals have unanswered questions', 'Medium findings. No critical or high failures.', 'warn'],
    ['The team closes both questions with revision 2 and re-approves', 'New approvals, new evidence for the new revisions.', ''],
    ['Verdict **PASS**; the sealed report is attached to the release', 'Anyone can verify it later with one command.', 'ok']] },
};
