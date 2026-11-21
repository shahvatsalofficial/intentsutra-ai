import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {approve, link, attest, revise, init, ingest} from '../packages/core/registry.mjs';
import {runAudit, verifyAuditReport, auditHtml, auditMarkdown, writeAuditReports} from '../packages/core/assurance.mjs';
import {temp, fixture, withReq, req} from './helpers.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = (args, cwd) => spawnSync(process.execPath, [path.join(root, 'packages/cli/index.mjs'), ...args], {cwd, encoding: 'utf8'});
const human = {reviewer: 'Asha', note: 'reviewed', revision: 1, confirmHuman: true};
const check = (a, id) => a.checks.find(c => c.id === id);
const editRegistry = (t, fn) => {
  const f = path.join(t.path, '.intentsutra', 'requirements.json');
  const reg = JSON.parse(fs.readFileSync(f, 'utf8'));
  fn(reg);
  fs.writeFileSync(f, JSON.stringify(reg, null, 2));
};
function full(t) {
  fixture(t.path, 'impl.js', 'code'); fixture(t.path, 'run.txt', 'passed log'); fixture(t.path, 'rel.txt', 'release note');
  approve(t.path, t.id, human);
  link(t.path, t.id, {kind: 'code', ref: 'impl.js', revision: 1});
  link(t.path, t.id, {kind: 'test-run', ref: 'run.txt', revision: 1, outcome: 'passed'});
  link(t.path, t.id, {kind: 'release', ref: 'rel.txt', revision: 1, outcome: 'released'});
  attest(t.path, t.id, human);
}

test('audit of a fresh workspace has no critical or high failures', () => {
  const t = withReq(req);
  try {
    const a = runAudit(t.path);
    assert.ok(['PASS', 'PASS-WITH-FINDINGS'].includes(a.verdict), a.verdict);
    assert.equal(a.summary.bySeverity.critical + a.summary.bySeverity.high, 0);
    assert.equal(check(a, 'AUD-01').status, 'pass');
  } finally { t.clean(); }
});

test('legitimate full evidence lifecycle audits clean and stays labeled unverified', () => {
  const t = withReq(req);
  try {
    full(t);
    const a = runAudit(t.path);
    assert.equal(a.summary.attested, 1);
    assert.equal(a.summary.bySeverity.critical + a.summary.bySeverity.high, 0);
    assert.equal(check(a, 'AUD-04').status, 'pass');
    assert.equal(check(a, 'AUD-06').status, 'pass');
  } finally { t.clean(); }
});

test('registry edited without an audit event is detected (silent approval forgery)', () => {
  const t = withReq(req);
  try {
    editRegistry(t, r => r.requirements[0].approvals.push({revision: 1, reviewer: 'Mallory', note: 'x', time: 'now', kind: 'local-self-attested-approval', identityVerified: false}));
    const a = runAudit(t.path);
    assert.equal(a.verdict, 'FAIL');
    assert.equal(check(a, 'AUD-08').status, 'fail');
  } finally { t.clean(); }
});

test('forged identityVerified=true is flagged', () => {
  const t = withReq(req);
  try {
    approve(t.path, t.id, human);
    editRegistry(t, r => { r.requirements[0].approvals[0].identityVerified = true; });
    assert.equal(check(runAudit(t.path), 'AUD-07').status, 'fail');
  } finally { t.clean(); }
});

test('upgraded imported test-run label is flagged', () => {
  const t = withReq(req);
  try {
    fixture(t.path, 'run.txt', 'log');
    link(t.path, t.id, {kind: 'test-run', ref: 'run.txt', revision: 1, outcome: 'passed'});
    editRegistry(t, r => { r.requirements[0].links[0].provenance = 'verified-by-ci'; });
    assert.equal(check(runAudit(t.path), 'AUD-06').status, 'fail');
  } finally { t.clean(); }
});

test('tampered audit chain fails with critical finding', () => {
  const t = withReq(req);
  try {
    approve(t.path, t.id, human);
    const f = path.join(t.path, '.intentsutra', 'audit.jsonl');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('Asha', 'Evil'));
    const a = runAudit(t.path);
    assert.equal(check(a, 'AUD-01').status, 'fail');
    assert.equal(a.verdict, 'FAIL');
  } finally { t.clean(); }
});

test('evidence file modified after linking is drift', () => {
  const t = withReq(req);
  try {
    fixture(t.path, 'impl.js', 'v1');
    link(t.path, t.id, {kind: 'code', ref: 'impl.js', revision: 1});
    fixture(t.path, 'impl.js', 'v2');
    const a = runAudit(t.path);
    assert.equal(check(a, 'AUD-03').status, 'fail');
    assert.match(check(a, 'AUD-03').failures[0], /hash-mismatch/);
  } finally { t.clean(); }
});

test('edited requirement content without revision is detected by content hash', () => {
  const t = withReq(req);
  try {
    editRegistry(t, r => { r.requirements[0].behavior = 'silently changed'; });
    assert.equal(check(runAudit(t.path), 'AUD-02').status, 'fail');
  } finally { t.clean(); }
});

test('revision makes old approval stale and audit still passes consistency', () => {
  const t = withReq(req);
  try {
    approve(t.path, t.id, human);
    fixture(t.path, 'v2.json', JSON.stringify({...req, behavior: 'Invitation expires after 7 days'}));
    assert.equal(revise(t.path, t.id, 'v2.json').changed, true);
    const a = runAudit(t.path);
    assert.equal(check(a, 'AUD-08').status, 'pass');
    assert.equal(a.requirements[0].state, 'needs-stakeholder-approval');
  } finally { t.clean(); }
});

test('test-file without passed run is reported as proof-by-proxy gap', () => {
  const t = withReq(req);
  try {
    fixture(t.path, 'a.test.js', 't');
    link(t.path, t.id, {kind: 'test', ref: 'a.test.js', revision: 1});
    assert.match(check(runAudit(t.path), 'AUD-11').failures.join(' '), /not a test pass/);
  } finally { t.clean(); }
});

test('audit report seal verifies and detects modification', () => {
  const t = withReq(req);
  try {
    const a = JSON.parse(JSON.stringify(runAudit(t.path)));
    assert.equal(verifyAuditReport(a).valid, true);
    a.verdict = 'PASS-FORGED';
    assert.equal(verifyAuditReport(a).valid, false);
    assert.equal(verifyAuditReport({}).valid, false);
  } finally { t.clean(); }
});

test('audit HTML and Markdown escape hostile titles and pipes', () => {
  const t = temp();
  try {
    init(t.path);
    fixture(t.path, 'e.json', JSON.stringify({...req, id: 'REQ-EVIL-001', title: '<script>alert(1)</script> | x'}));
    ingest(t.path, 'e.json');
    editRegistry(t, r => { r.requirements[0].links.push({kind: 'code', ref: '<img src=x onerror=1>', revision: 1, provenance: 'x'}); });
    const a = runAudit(t.path);
    assert.ok(!auditHtml(a).includes('<script>alert'));
    assert.ok(!auditHtml(a).includes('<img src=x'));
    assert.ok(!/\| x\s*\|/.test(auditMarkdown(a).split('## Requirements')[1].split('\n')[2] ?? ''));
  } finally { t.clean(); }
});

test('writeAuditReports writes JSON, Markdown and HTML and refuses escaping paths', () => {
  const t = withReq(req);
  try {
    const {files} = writeAuditReports(t.path, 'out');
    for (const f of Object.values(files)) assert.ok(fs.existsSync(f));
    assert.match(fs.readFileSync(files.html, 'utf8'), /Independent Audit Report/);
    assert.throws(() => writeAuditReports(t.path, '../outside'), /outside/);
  } finally { t.clean(); }
});

test('CLI: audit writes three reports, verify passes, tampered report fails verify', () => {
  const t = withReq(req);
  try {
    const r = cli(['audit', '--out', 'audit-out', '--quiet'], t.path);
    assert.equal(r.status, 0, r.stderr);
    for (const f of ['audit-report.json', 'audit-report.md', 'audit-report.html']) assert.ok(fs.existsSync(path.join(t.path, 'audit-out', f)));
    assert.equal(cli(['verify', '--report', 'audit-out/audit-report.json'], t.path).status, 0);
    const j = path.join(t.path, 'audit-out', 'audit-report.json');
    fs.writeFileSync(j, fs.readFileSync(j, 'utf8').replace('"verdict": "PASS"', '"verdict": "FAIL"'));
    assert.equal(cli(['verify', '--report', 'audit-out/audit-report.json'], t.path).status, 1);
  } finally { t.clean(); }
});

test('CLI: --strict exits 2 on FAIL verdict', () => {
  const t = withReq(req);
  try {
    editRegistry(t, r => r.requirements[0].approvals.push({revision: 1, identityVerified: false}));
    assert.equal(cli(['audit', '--quiet', '--strict'], t.path).status, 2);
  } finally { t.clean(); }
});

test('CLI: --confirm-human placed before other flags is still a boolean', () => {
  const t = withReq(req);
  try {
    const r = cli(['approve', '--confirm-human', '--id', t.id, '--revision', '1', '--reviewer', 'Asha', '--note', 'ok'], t.path);
    assert.equal(r.status, 0, r.stderr);
  } finally { t.clean(); }
});

test('CLI: --version, bad argument and missing registry exit codes', () => {
  const t = temp();
  try {
    const v = cli(['--version'], t.path);
    assert.equal(v.status, 0);
    assert.match(v.stdout.trim(), /^\d+\.\d+\.\d+$/);
    assert.equal(cli(['list', 'stray'], t.path).status, 1);
    assert.equal(cli(['list'], t.path).status, 1);
    const w = withReq(req);
    try { assert.equal(cli(['impact', '--id', 'REQ-NOPE-1'], w.path).status, 1); } finally { w.clean(); }
  } finally { t.clean(); }
});
