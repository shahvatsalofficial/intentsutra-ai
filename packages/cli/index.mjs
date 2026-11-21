#!/usr/bin/env node
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {init, load, ingest, review, revise, approve, link, attest, getRequirement} from '../core/registry.mjs';
import {trace, impact} from '../core/trace.mjs';
import {generate} from '../core/reports.mjs';
import {verifyAudit} from '../core/audit.mjs';
import {writeAuditReports, verifyAuditReport} from '../core/assurance.mjs';
import {createServer} from '../server/server.mjs';
import {installIde, HOSTS} from '../core/installer.mjs';
import {IntentError, readJson} from '../core/common.mjs';

const VERSION = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8')).version;
const BOOLEAN_FLAGS = new Set(['confirm-human', 'force', 'quiet', 'version', 'help', 'strict']);
const help = `IntentSutra AI v${VERSION} · by Vatsal Shah
  init [--workspace .]
  ingest --file brief.md|requirements.json [--workspace .]
  list | review --id REQ-... | trace | impact --id REQ-...
  revise --id REQ-... --file updated.md --revision <current>
  approve --id REQ-... --revision N --reviewer NAME --note TEXT --confirm-human
  link --id REQ-... --revision N --kind code|test|test-run|release|ticket|pr --ref FILE_OR_REFERENCE [--outcome passed|failed|unknown|released|blocked]
  attest --id REQ-... --revision N --reviewer NAME --note TEXT --confirm-human
  report [--out reports]
  audit [--out audit-out] [--quiet] [--strict]   independent audit; writes audit-report.json/.md/.html
  verify --report audit-report.json              check an audit report seal
  doctor | --version
  serve [--token TOKEN or INTENTSUTRA_TOKEN env] [--port 0]
  install-ide --target PATH --host ${HOSTS.join('|')} [--force]
Exit codes: 0 ok · 1 error or refused action · 2 audit FAIL with --strict.
No cloud API key; no automatic requirement completion or stakeholder approval.`;

function parse(argv) {
  const opts = Object.create(null);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new IntentError(`Unexpected argument ${a}`, 'INVALID_ARG');
    const k = a.slice(2);
    if (BOOLEAN_FLAGS.has(k)) opts[k] = true;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opts[k] = argv[++i];
    else opts[k] = true;
  }
  return opts;
}

const out = v => console.log(JSON.stringify(v, null, 2));
try {
  const argv = process.argv.slice(2);
  const cmd = argv[0] && !argv[0].startsWith('--') ? argv.shift() : (argv.includes('--version') ? 'version' : 'help');
  const opts = parse(argv);
  const ws = typeof opts.workspace === 'string' ? opts.workspace : process.cwd();
  const req = k => { if (typeof opts[k] !== 'string') throw new IntentError(`Missing --${k}`, 'MISSING_ARG'); return opts[k]; };
  const human = () => ({reviewer: req('reviewer'), note: req('note'), revision: req('revision'), confirmHuman: opts['confirm-human'] === true});
  switch (cmd) {
    case 'help': console.log(help); break;
    case 'version': console.log(VERSION); break;
    case 'init': out(init(ws)); break;
    case 'ingest': out(ingest(ws, req('file'))); break;
    case 'list': out(load(ws).reg.requirements.map(r => ({id: r.id, revision: r.revision, title: r.title, questions: r.questions.length}))); break;
    case 'review': out(review(ws, req('id'))); break;
    case 'trace': out(trace(ws)); break;
    case 'impact': {
      const x = impact(ws, req('id'));
      if (!x) throw new IntentError('Requirement not found', 'NOT_FOUND');
      out(x); break;
    }
    case 'revise': {
      const r = getRequirement(ws, req('id'));
      if (Number(req('revision')) !== r.revision) throw new IntentError('Expected revision mismatch', 'STALE_REVISION');
      out(revise(ws, r.id, req('file'))); break;
    }
    case 'approve': out(approve(ws, req('id'), human())); break;
    case 'link': out(link(ws, req('id'), {kind: req('kind'), ref: req('ref'), revision: req('revision'), outcome: opts.outcome})); break;
    case 'attest': out(attest(ws, req('id'), human())); break;
    case 'report': out(generate(ws, typeof opts.out === 'string' ? opts.out : undefined).outputs); break;
    case 'audit': {
      const {report, files} = writeAuditReports(ws, typeof opts.out === 'string' ? opts.out : undefined);
      const chain = verifyAudit(load(ws).s.audit);
      if (!opts.quiet) out({...chain, verdict: report.verdict, summary: report.summary, files});
      if (opts.strict && report.verdict === 'FAIL') process.exitCode = 2;
      break;
    }
    case 'verify': {
      const file = req('report');
      const v = verifyAuditReport(readJson(path.resolve(ws, file)));
      out(v);
      if (!v.valid) process.exitCode = 1;
      break;
    }
    case 'doctor': out({node: process.version, minimumNode22: Number(process.versions.node.split('.')[0]) >= 22, offline: true, runtimeDependencies: 0, ideAdapters: HOSTS, hostExecutionVerified: false, serverMode: 'authenticated-loopback-read-only'}); break;
    case 'serve': {
      const token = typeof opts.token === 'string' ? opts.token : process.env.INTENTSUTRA_TOKEN;
      if (!token) throw new IntentError('Set INTENTSUTRA_TOKEN or --token', 'MISSING_TOKEN');
      const port = opts.port ? Number(opts.port) : 0;
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new IntentError('Invalid port', 'INVALID_PORT');
      const server = createServer({workspace: ws, token, port});
      server.on('listening', () => console.log(`IntentSutra read-only server listening at http://127.0.0.1:${server.address().port}`));
      break;
    }
    case 'install-ide': out(installIde(req('target'), req('host'), {force: opts.force === true})); break;
    default: throw new IntentError('Unknown command; use help', 'INVALID_COMMAND');
  }
} catch (e) {
  console.error(`${e.code ?? 'ERROR'}: ${e.message}`);
  process.exitCode = 1;
}
