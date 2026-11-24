#!/usr/bin/env node
// Builds the documentation website into documents/html from documents/md. Dependency-free.
// Light theme by default; dark by toggle (remembered). Run `npm run proof` first so the numbers are current.
// Directives in Markdown (alone on a line): {{svg:name}} {{flow:name}} {{chart:name}} {{checks}}; plain {{VARS}} are filled from docs/proof.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DIAGRAMS, FLOWS} from './site/diagrams.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, '..');
const MD = path.join(HERE, 'md'), OUT = path.join(HERE, 'html');
const GH = 'https://github.com/shahvatsalofficial/intentsutra-ai';
const SITE = 'https://shahvatsalofficial.github.io/intentsutra-ai';
const NPM = 'https://www.npmjs.com/package/intentsutra-ai';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const headingId = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const rd = p => JSON.parse(fs.readFileSync(path.join(PROJECT, p), 'utf8'));
const env = rd('docs/proof/environment.json'), fuzz = rd('docs/proof/fuzz-results.json'), good = rd('docs/proof/audit-sample/audit-report.json'), bad = rd('docs/proof/audit-sample-forged/audit-report.json');
const V = env.version;
const vars = {VERSION: V, NODE: env.node, PLATFORM: env.platform, RECORDED: env.recordedAt, TESTS: env.tests, PASS: env.pass, FAIL: env.fail, SKIPPED: env.skipped, AUDIT_CHECKS: env.auditChecks, AUDIT_PASSED: env.auditPassed, AUDIT_FAILED: env.auditFailed, VERDICT: env.verdict, FORGED: env.forgedVerdict, FUZZ: env.fuzzCases, FUZZ_FAIL: env.fuzzFailures, TAMPER: fuzz.auditTamperCases, IMPORTS: fuzz.importCases, REQCASES: fuzz.requirementCases, RENDER: fuzz.rendererCases};
const fill = s => s.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => { if (!(k in vars)) throw new Error('Unknown placeholder ' + k); return String(vars[k]); });

const GROUPS = [
  ['Start here', ['01-executive-summary', '05-user-guide', '14-real-world-scenarios']],
  ['Reference', ['02-functional-specification', '04-technical-reference', '07-rules-and-evidence', '12-glossary']],
  ['Design and trust', ['03-architecture', '06-security-and-privacy', '08-test-report', '13-assurance-and-evidence', '10-legal-and-governance']],
  ['Project', ['09-operations-and-release', '11-roadmap-and-faq']],
];
const ORDER = GROUPS.flatMap(g => g[1]);

const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  terminal: '<path d="M4 17l6-6-6-6M12 19h8"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
};
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join('')}</defs></svg>`;
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${n}"/></svg>`;

// ---------- Markdown ----------
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
      u = u.replace(/&amp;/g, '&');
      u = u.replace(/^([\w-]+)\.md(#|$)/, '$1.html$2').replace(/^(\d\d-[\w-]+)(#|$)/, '$1.html$2');
      return `<a href="${esc(u)}"${/^https?:/.test(u) ? ' rel="noopener"' : ''}>${t}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:)]|$)/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}
function mdToHtml(md, ctx) {
  const lines = md.split(/\r?\n/), out = [], toc = [];
  let i = 0, firstQuote = true;
  const para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { flush(); i++; continue; }
    const fence = l.match(/^```(\w*)/);
    if (fence) { flush(); const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre class="code" data-lang="${esc(fence[1])}"><code>${esc(buf.join('\n'))}</code><button class="copy" type="button">Copy</button></pre>`); continue; }
    const dir = l.match(/^\{\{(\w+)(?::(\w+))?\}\}$/);
    if (dir) { flush(); out.push(ctx.directive(dir[1], dir[2])); i++; continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush(); const id = headingId(h[2]); const n = h[1].length;
      if (n === 2 || n === 3) toc.push({level: n, text: h[2].replace(/`/g, ''), id});
      out.push(n === 1 ? `<h1>${inline(h[2])}</h1>` : `<h${n} id="${id}">${inline(h[2])}<a class="anchor" href="#${id}" aria-label="Link to this section">#</a></h${n}>`); i++; continue;
    }
    if (/^---+\s*$/.test(l)) { flush(); out.push('<hr>'); i++; continue; }
    if (/^>\s?/.test(l)) {
      flush(); const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      const text = buf.join(' '); const k = text.match(/^\*\*(Warning|Important|Tip|Note)\*\*\s*/);
      if (firstQuote && !k) { firstQuote = false; out.push(`<blockquote class="lead-q">${inline(text)}</blockquote>`); }
      else out.push(`<blockquote class="callout-${k ? k[1].toLowerCase() : 'note'}">${k ? `<strong>${k[1]}.</strong> ${inline(text.slice(k[0].length))}` : inline(text)}</blockquote>`);
      firstQuote = false; continue;
    }
    if (/^\|.*\|\s*$/.test(l) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      flush(); const cells = r => r.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const head = cells(l), align = cells(lines[i + 1]).map(c => /^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : 'left'); i += 2; const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => `<th scope="col" style="text-align:${align[k]}">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, k) => `<td style="text-align:${align[k]}">${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    const li = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      flush(); const ordered = /\d/.test(li[2]); const items = [];
      while (i < lines.length) { const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/); if (m) { items.push({depth: Math.floor(m[1].length / 2), text: m[3]}); i++; } else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1].text += ' ' + lines[i].trim(); i++; } else break; }
      const tag = ordered ? 'ol' : 'ul'; let html = '', depth = -1;
      for (const it of items) { while (depth < it.depth) { html += `<${tag}>`; depth++; } while (depth > it.depth) { html += `</li></${tag}>`; depth--; } html += `<li>${inline(it.text)}`; }
      while (depth >= 0) { html += `</li></${tag}>`; depth--; }
      out.push(html); continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return {html: out.join('\n'), toc};
}

// ---------- data-driven blocks ----------
const bars = (rows, cls = '') => `<div class="bars">${rows.map(([l, v, max, c]) => `<div class="bar"><span class="lab">${esc(l)}</span><div class="trk"><div class="fill ${c || cls}" style="width:${max ? Math.max(3, Math.round(100 * v / max)) : 0}%"></div></div><span class="val">${v}</span></div>`).join('')}</div>`;
const chart = (title, body, note = '') => `<figure class="chart"><h4>${esc(title)}</h4>${body}${note ? `<p class="note">${esc(note)}</p>` : ''}</figure>`;
const stack = (parts, label) => `<div class="stack" role="img" aria-label="${esc(label)}">${parts.map(([v, c]) => `<i style="width:${v}%;background:var(${c})"></i>`).join('')}</div>`;
const legend = items => `<p class="legend">${items.map(([c, t]) => `<span><b style="background:var(${c})"></b>${esc(t)}</span>`).join('')}</p>`;
const sevCount = Object.entries(good.checks.reduce((a, c) => (a[c.severity] = (a[c.severity] || 0) + 1, a), {}));
const CHARTS = {
  tests: () => chart('Test run', stack([[100 * env.pass / env.tests, '--ok'], [100 * env.skipped / env.tests, '--warn'], [100 * env.fail / env.tests, '--bad']], `${env.pass} passed, ${env.skipped} skipped, ${env.fail} failed`) + legend([['--ok', `${env.pass} passed`], ['--warn', `${env.skipped} skipped (file symlinks need OS privilege)`], ['--bad', `${env.fail} failed`]]), `Node ${env.node} on ${env.platform}, ${env.recordedAt.slice(0, 10)}. Raw log: test-results/test-run.tap.`),
  severity: () => { const order = ['critical', 'high', 'medium', 'info']; const rows = order.map(s => [s, (sevCount.find(([k]) => k === s) || [s, 0])[1]]); return chart(`${good.summary.checks} audit checks by severity`, bars(rows.map(([k, v]) => [k, v, Math.max(...rows.map(r => r[1])), k === 'critical' ? 'bad' : k === 'high' ? 'warn' : ''])), 'Critical and high failures give verdict FAIL. Medium gives PASS-WITH-FINDINGS.'); },
  fuzz: () => { const rows = [['requirement records', fuzz.requirementCases], ['Markdown inputs', fuzz.markdownCases], ['hostile import files', fuzz.importCases], ['audit-log byte edits', fuzz.auditTamperCases], ['injection renders', fuzz.rendererCases]]; return chart(`${env.fuzzCases} fuzzed inputs, ${env.fuzzFailures} failures`, bars(rows.map(([k, v]) => [k, v, Math.max(...rows.map(r => r[1])), 'ok'])), `Fixed seed ${fuzz.seed}. All ${fuzz.auditTamperCases} audit-log edits were detected. Only the intended error type is accepted as a failure mode.`); },
  verdicts: () => chart('Same workspace, two verdicts', `<div class="cmp"><div class="g"><h4>Honest history: ${esc(good.verdict)}</h4><p>${good.summary.passed} of ${good.summary.checks} checks pass. Every approval, link and revision has a matching audit event.</p></div><div class="b"><h4>After a silent edit: ${esc(bad.verdict)}</h4><p>${bad.summary.failed} checks fail. The registry shows an approval the audit log never recorded.</p></div></div>`),
};
const checksTable = () => `<div class="table-wrap"><table><thead><tr><th scope="col">ID</th><th scope="col">Check</th><th scope="col">Severity</th><th scope="col">Honest sample</th><th scope="col">After silent edit</th></tr></thead><tbody>${good.checks.map(c => { const b = bad.checks.find(x => x.id === c.id); return `<tr><td><code>${c.id}</code></td><td>${esc(c.title)}</td><td>${c.severity}</td><td>${c.status === 'pass' ? 'pass' : '<strong>FAIL</strong>'}</td><td>${b.status === 'pass' ? 'pass' : '<strong>FAIL</strong>'}</td></tr>`; }).join('')}</tbody></table></div>`;
const ctx = {
  directive(name, arg) {
    if (name === 'svg') return `<figure class="dia">${DIAGRAMS[arg]?.() ?? ''}</figure>`;
    if (name === 'chart') return CHARTS[arg]?.() ?? '';
    if (name === 'checks') return checksTable();
    if (name === 'flow') { const f = FLOWS[arg]; if (!f) throw new Error('Unknown flow ' + arg); return `<ol class="flow${f.row ? ' row' : ''}" style="--n:${f.steps.length}">${f.steps.map(([t, d, c]) => `<li class="${c || ''}"><b>${inline(t)}</b>${d ? `<span>${inline(d)}</span>` : ''}</li>`).join('')}</ol>`; }
    throw new Error('Unknown directive ' + name);
  },
};

// ---------- page shell ----------
const themeInit = `try{var t=localStorage.getItem('intentsutra-theme');document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')}catch(e){document.documentElement.setAttribute('data-theme','light')}`;
const head = ({title, desc, canon}) => `<!DOCTYPE html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#0f766e"><meta name="author" content="Vatsal Shah"><link rel="canonical" href="${canon}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="website"><meta property="og:site_name" content="IntentSutra AI"><meta property="og:url" content="${canon}"><meta name="twitter:card" content="summary"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230f766e'/%3E%3Ctext x='16' y='22' font-size='16' font-family='Arial' font-weight='700' fill='white' text-anchor='middle'%3EIS%3C/text%3E%3C/svg%3E"><script>${themeInit}</script><link rel="stylesheet" href="assets/site.css">`;
const LD = JSON.stringify({'@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'IntentSutra AI', applicationCategory: 'DeveloperApplication', operatingSystem: 'Windows, macOS, Linux (Node.js 22+)', softwareVersion: V, license: 'https://www.apache.org/licenses/LICENSE-2.0', author: {'@type': 'Person', name: 'Vatsal Shah', url: 'https://github.com/shahvatsalofficial'}, url: SITE + '/', codeRepository: GH, description: 'Local-first requirements-to-evidence traceability CLI: revision-bound requirement IDs, human approvals, hash-pinned evidence, stale-evidence detection and independent audit reports in Markdown, HTML and JSON. Not a certification or compliance tool.', offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}}).replace(/</g, '\\u003c');
const NAV = [['05-user-guide', 'Guide'], ['14-real-world-scenarios', 'Scenarios'], ['03-architecture', 'Architecture'], ['13-assurance-and-evidence', 'Proof'], ['07-rules-and-evidence', 'Rules']];
const topbar = (home, cur) => `<header class="topbar"><div class="topbar-in"><button class="icon-btn menu-btn" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="sidebar">${ic('menu')}</button><a class="brand" href="${home ? '#top' : 'index.html'}"><span class="logo" aria-hidden="true">IS</span><span class="brand-name">Intent<b>Sutra</b> AI</span><span class="ver">v${V}</span></a>
<nav class="topnav" aria-label="Primary">${NAV.map(([s, t]) => `<a href="${s}.html"${cur === s ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
<div class="search" role="search">${ic('search', 18)}<label class="sr" for="q">Search the documentation</label><input id="q" type="search" placeholder="Search docs" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="results"><kbd aria-hidden="true">/</kbd><ul id="results" role="listbox" hidden></ul></div>
<a class="icon-btn gh" href="${GH}" rel="noopener" aria-label="IntentSutra AI on GitHub">${ic('code')}</a>
<button class="icon-btn theme-btn" type="button" aria-pressed="false" aria-label="Switch to dark theme"><svg class="ic i-sun" width="20" height="20" aria-hidden="true"><use href="#i-sun"/></svg><svg class="ic i-moon" width="20" height="20" aria-hidden="true"><use href="#i-moon"/></svg></button></div></header>`;
const footer = () => `<footer class="site-foot"><div class="foot-in"><div class="foot-brand"><a class="brand" href="index.html"><span class="logo" aria-hidden="true">IS</span><span class="brand-name">Intent<b>Sutra</b> AI</span></a><p>From intent to evidence. A local-first requirements-to-proof workbench that keeps humans accountable.</p><p class="fine">Created by Vatsal Shah. Apache-2.0.</p></div>
<div><p class="foot-title">Start</p><ul><li><a href="01-executive-summary.html">Overview</a></li><li><a href="05-user-guide.html">User guide</a></li><li><a href="14-real-world-scenarios.html">Scenarios</a></li></ul></div>
<div><p class="foot-title">Reference</p><ul><li><a href="04-technical-reference.html">Technical reference</a></li><li><a href="07-rules-and-evidence.html">Rules and evidence</a></li><li><a href="12-glossary.html">Glossary</a></li></ul></div>
<div><p class="foot-title">Trust</p><ul><li><a href="06-security-and-privacy.html">Security</a></li><li><a href="13-assurance-and-evidence.html">Assurance</a></li><li><a href="10-legal-and-governance.html">Legal</a></li></ul></div>
<div><p class="foot-title">Project</p><ul><li><a href="${GH}" rel="noopener">GitHub</a></li><li><a href="${NPM}" rel="noopener">npm</a></li><li><a href="${GH}/blob/main/CHANGELOG.md" rel="noopener">Changelog</a></li></ul></div></div>
<p class="legal">IntentSutra AI ${V}. An audit PASS means the recorded evidence is internally consistent, nothing more: it is not a certification, a legal opinion or proof that software is correct. Product names mentioned belong to their owners; no endorsement is implied.</p></footer>`;
const tail = idx => `<script>window.__DOCS_INDEX__=${JSON.stringify(idx).replace(/</g, '\\u003c')}</script><script src="assets/site.js" defer></script></body></html>`;

// ---------- build ----------
const pages = ORDER.map(slug => {
  const raw = fill(fs.readFileSync(path.join(MD, slug + '.md'), 'utf8'));
  return {slug, raw, title: (raw.match(/^#\s+(.+)$/m) || [, slug])[1], summary: (raw.match(/^>\s+(.+)$/m) || [, ''])[1].replace(/[*`]/g, '')};
});
const unknown = fs.readdirSync(MD).filter(f => f.endsWith('.md') && !ORDER.includes(f.slice(0, -3)));
if (unknown.length) throw new Error(`Markdown files missing from GROUPS: ${unknown.join(', ')}`);
const plain = md => md.replace(/```[\s\S]*?```/g, ' ').replace(/\{\{[^}]*\}\}/g, ' ').replace(/[`*#>|_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
const index = pages.map(p => ({t: p.title, u: `${p.slug}.html`, x: plain(p.raw).slice(0, 2500)}));
const side = cur => `<aside class="sidebar" id="sidebar" aria-label="Documentation"><a class="nav-home" href="index.html">Home</a>${GROUPS.map(([g, slugs]) => `<div class="nav-group"><p class="nav-title">${g}</p><ol>${slugs.map(s => `<li><a href="${s}.html"${s === cur ? ' aria-current="page"' : ''}>${esc(pages.find(x => x.slug === s).title)}</a></li>`).join('')}</ol></div>`).join('')}</aside><div class="scrim" hidden></div>`;

// keep proof artifacts served beside the pages
for (const sub of ['samples', 'test-results']) fs.rmSync(path.join(OUT, sub), {recursive: true, force: true});
for (const f of fs.readdirSync(OUT, {withFileTypes: true})) if (f.isFile() && /\.(html|xml|txt)$/.test(f.name)) fs.rmSync(path.join(OUT, f.name));
fs.rmSync(path.join(OUT, 'assets'), {recursive: true, force: true});
fs.mkdirSync(path.join(OUT, 'assets'), {recursive: true});
const cp = (from, to) => { fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(from, to); };
const PROOF = path.join(PROJECT, 'docs/proof');
for (const f of fs.readdirSync(PROOF)) { const p = path.join(PROOF, f); if (fs.statSync(p).isFile() && f !== 'README.md') cp(p, path.join(OUT, f.startsWith('cli-') ? 'samples' : 'test-results', f)); }
fs.cpSync(path.join(PROOF, 'audit-sample'), path.join(OUT, 'samples/audit'), {recursive: true});
fs.cpSync(path.join(PROOF, 'audit-sample-forged'), path.join(OUT, 'samples/audit-forged'), {recursive: true});
fs.writeFileSync(path.join(OUT, 'assets/site.css'), fs.readFileSync(path.join(HERE, 'site/site.css'), 'utf8') + fs.readFileSync(path.join(HERE, 'site/extra.css'), 'utf8') + '\n.dia-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}.dia-scroll svg.dia{min-width:600px}.table-wrap td:first-child code{white-space:nowrap;overflow-wrap:normal}\n');
fs.copyFileSync(path.join(HERE, 'site/site.js'), path.join(OUT, 'assets/site.js'));

pages.forEach((p, n) => {
  const {html, toc} = mdToHtml(p.raw, ctx);
  const prev = pages[n - 1], next = pages[n + 1];
  const tocUl = toc.length ? `<ul>${toc.map(t => `<li class="l${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ul>` : '';
  const body = html.replace(/^<h1>/, `<p class="eyebrow">${esc(GROUPS.find(g => g[1].includes(p.slug))[0])}</p><h1>`);
  fs.writeFileSync(path.join(OUT, p.slug + '.html'), `${head({title: `${p.title} · IntentSutra AI`, desc: p.summary || p.title, canon: `${SITE}/${p.slug}.html`})}</head><body><a class="skip" href="#content">Skip to content</a>${sprite}${topbar(false, p.slug)}<div class="layout">${side(p.slug)}<main class="content" id="content" tabindex="-1"><article class="prose">${body}<details class="toc-m"><summary>On this page</summary>${tocUl}</details><p class="edit"><a href="${GH}/blob/main/documents/md/${p.slug}.md" rel="noopener">Edit this page on GitHub</a></p><nav class="pager" aria-label="Pagination">${prev ? `<a class="prev" href="${prev.slug}.html"><span>Previous</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}${next ? `<a class="next" href="${next.slug}.html"><span>Next</span><b>${esc(next.title)}</b></a>` : '<span></span>'}</nav></article></main><nav class="toc" aria-label="On this page"><h2>On this page</h2>${tocUl}</nav></div>${footer()}${tail(index)}`);
});

// ----- home -----
const failing = bad.checks.filter(c => c.status === 'fail');
const mock = `<div class="mock" role="img" aria-label="Example audit report: verdict FAIL after a silent registry edit, with the failing checks listed"><div class="mock-bar"><i></i><i></i><i></i><span>audit-report.html</span></div><div class="mock-in"><div class="mock-head"><b>Independent audit report</b><span class="pill bad">${esc(bad.verdict)}</span></div><div class="mock-cards"><div><b>${bad.summary.requirements}</b><span>requirements</span></div><div><b>${bad.summary.passed}/${bad.summary.checks}</b><span>checks pass</span></div><div><b>${bad.summary.auditEvents}</b><span>audit events</span></div></div><ul class="mock-list">${failing.slice(0, 3).map(f => `<li><span class="pill bad">${f.severity}</span> <code>${f.id}</code> ${esc(f.title.length > 58 ? f.title.slice(0, 56) + '…' : f.title)}</li>`).join('')}</ul></div></div>`;
const feat = [['file', 'Stable IDs, explicit unknowns', 'Every requirement keeps one ID and a revision number. Missing actor, trigger, authorization and failure paths become questions, never guesses.'], ['check', 'Human approvals, exact revision', 'Approval needs a named reviewer, a note, the exact revision and an explicit flag. It is recorded as self-attested, honestly.'], ['layers', 'Evidence bound to a version', 'Code, test, test-run and release links carry the revision and a SHA-256. Change the requirement and old evidence turns stale.'], ['eye', 'Proof, not pointers', 'A ticket, a PR or a test file never counts as done. The strongest state is human-attested, never "completed".'], ['shield', 'Independent audit, sealed', 'Eleven checks recompute hashes and cross-check the registry against the log. JSON, Markdown and HTML, sealed with SHA-256.'], ['lock', 'Local, offline, zero dependencies', 'No network, no API key, no telemetry. Hostile text stays inert data. The tool never runs your tests or code.']];
const scnDefs = [['1', 'The one-line feature request', 'A ticket says "add invitations". The tool lists everything nobody decided.', 'k-info'], ['2', 'The rule changed after sign-off', 'Old approvals and evidence turn stale instead of silently counting.', 'k-warn'], ['3', '"Tests are linked" is not "tests passed"', 'Proof-by-proxy gaps surface before the release call.', 'k-bad'], ['4', 'Someone edited the record by hand', 'The audit recounts and fails with a critical finding.', 'k-bad']];
const scnPage = pages.find(p => p.slug === '14-real-world-scenarios');
const scnLink = n => { const m = mdToHtml(scnPage.raw, ctx).toc.find(t => t.text.startsWith(`Scenario ${n}:`)); return `14-real-world-scenarios.html#${m ? m.id : ''}`; };
const faq = [['Does it need an API key or internet?', 'No. It uses only Node.js built-ins and makes no network calls.'], ['Does it run my tests?', 'No. You import the outcome and it is labelled "not independently verified". A runner is planned.'], ['Why can a requirement never be "completed"?', 'A tool cannot know that. It reports what is observed, imported, attested, stale or missing, and a person decides.'], ['Is an audit PASS a certification?', 'No. It means the recorded evidence is internally consistent. Read the limits section of every report.'], ['Can someone fake an approval?', 'With write access to the files, yes. The audit catches silent edits unless the whole record is rewritten, so keep it in Git with protected branches.'], ['Can I use it commercially?', 'Yes, under Apache-2.0.']];
const INSTALL = 'npx intentsutra-ai doctor';
const homeDesc = 'Local-first requirements-to-evidence traceability CLI: revision-bound IDs, human approvals, hash-pinned evidence, stale-evidence detection and independent audit reports in Markdown, HTML and JSON.';
const home = `${head({title: 'IntentSutra AI · From intent to evidence', desc: homeDesc, canon: `${SITE}/`})}<script type="application/ld+json">${LD}</script></head><body class="home-page" id="top"><a class="skip" href="#main">Skip to content</a>${sprite}${topbar(true, '')}
<main id="main"><section class="hero"><div class="wrap hero-grid"><div><p class="badge"><span class="dot"></span>v${V} · Apache-2.0 · zero dependencies</p><h1>From intent to <span class="grad">evidence</span>.</h1><p class="lead">IntentSutra AI turns a rough request into versioned requirements, records who approved which revision, links hashed evidence, and flags everything that went stale. Then an independent audit says what it could and could not verify. Local. Offline. Honest.</p>
<div class="cta"><a class="btn primary" href="05-user-guide.html">Get started ${ic('arrow', 18)}</a><a class="btn" href="14-real-world-scenarios.html">See real scenarios</a></div>
<div class="install"><span class="prompt" aria-hidden="true">$</span><code>${INSTALL}</code><button class="copy-inline" type="button" aria-label="Copy install command">${ic('copy', 16)}<span>Copy</span></button></div>
<ul class="facts"><li>Node 22+</li><li>No API key</li><li>No network</li><li>HTML · MD · JSON</li></ul></div><div class="hero-art">${mock}</div></div></section>
<section class="statband" aria-label="Key facts"><div class="wrap"><ul><li><b>${env.pass}</b><span>tests passing</span></li><li><b>${env.auditChecks}</b><span>audit checks</span></li><li><b>${env.fuzzCases.toLocaleString('en-US')}</b><span>fuzzed inputs, 0 failures</span></li><li><b>26</b><span>portable skills</span></li><li><b>0</b><span>runtime dependencies</span></li></ul></div></section>
<section class="sec"><div class="wrap"><p class="kicker">The problem</p><h2>Done is easy to claim and hard to prove</h2><p class="sub">A closed ticket, a merged PR, a test file or a green status is a pointer, not proof. Approvals get attached to text that later changed. Evidence goes stale in silence. IntentSutra makes that visible.</p><div class="feat-grid">${feat.map(([i, t, d]) => `<div class="feat"><div class="feat-ic">${ic(i, 22)}</div><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">How it works</p><h2>From a rough request to a sealed report</h2><p class="sub">Every step writes to a hash-chained log. A change at any point creates a new revision and makes earlier approvals and evidence stale.</p><figure class="dia" style="margin:0">${DIAGRAMS.pipeline()}</figure>
<ol class="steps"><li><span class="n">1</span><h3>Import</h3><p>Point it at a brief.</p><pre class="mini-code"><code>intentsutra ingest --file brief.md</code></pre></li><li><span class="n">2</span><h3>Approve and link</h3><p>A named human approves an exact revision, then evidence is linked.</p><pre class="mini-code"><code>intentsutra approve --confirm-human …</code></pre></li><li><span class="n">3</span><h3>Audit</h3><p>Get a sealed report in three formats.</p><pre class="mini-code"><code>intentsutra audit --out audit-out</code></pre></li></ol></div></section>
<section class="sec"><div class="wrap"><p class="kicker">One state flow, no "completed"</p><h2>What each requirement can be</h2><p class="sub">The strongest state is human-attested. A revision always sends a requirement back to the start and keeps the old record as stale history.</p><figure class="dia" style="margin:0">${DIAGRAMS.lifecycle()}</figure></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">Real-world scenarios</p><h2>Situations you will recognise</h2><p class="sub">Each scenario is a step-by-step flowchart showing what happens with the tool and what usually happens without it.</p><div class="scn-grid">${scnDefs.map(([n, t, d, k]) => `<a class="scard ${k}" href="${scnLink(n)}"><span class="snum">${n}</span><h3>${t}</h3><p>${d}</p><span class="more">Read the scenario ${ic('arrow', 16)}</span></a>`).join('')}</div></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Proof, with limits</p><h2>Measured, not promised</h2><p class="sub">Every number is regenerated from a real run on a stated machine. The audit is shown failing as well as passing: an audit that never fails proves nothing.</p>${CHARTS.verdicts()}${CHARTS.tests()}${CHARTS.fuzz()}<p class="cta" style="margin-top:1.2rem"><a class="btn" href="13-assurance-and-evidence.html">Method and raw results ${ic('arrow', 18)}</a><a class="btn ghost" href="samples/audit-forged/audit-report.html">Open the failing sample report</a></p></div></section>
<section class="sec alt"><div class="wrap"><p class="kicker">Who uses it</p><h2>Built for the people who sign things off</h2><div class="who"><div><b>Product owners</b><span>See every open question before approving.</span></div><div><b>Engineering leads</b><span>Bind code and test evidence to a revision.</span></div><div><b>Release managers</b><span>Block on a failed audit with one flag.</span></div><div><b>Internal auditors</b><span>Verify a sealed report independently.</span></div></div></div></section>
<section class="sec"><div class="wrap"><p class="kicker">Documentation</p><h2>Everything, in order</h2><div class="dgrid">${GROUPS.map(([g, slugs]) => `<div class="dgroup"><h3>${g}</h3><p>${slugs.length} pages</p><ul>${slugs.map(s => `<li><a href="${s}.html">${esc(pages.find(x => x.slug === s).title)}</a></li>`).join('')}</ul></div>`).join('')}</div></div></section>
<section class="sec alt"><div class="wrap narrow"><p class="kicker center">FAQ</p><h2 class="center">Quick answers</h2>${faq.map(([q, a]) => `<details class="qa"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>
<section class="cta-band"><div class="wrap"><h2>Make "done" mean something</h2><p>Free, offline and open source.</p><div class="install on-dark"><span class="prompt" aria-hidden="true">$</span><code>${INSTALL}</code><button class="copy-inline" type="button" aria-label="Copy install command">${ic('copy', 16)}<span>Copy</span></button></div><div class="cta center"><a class="btn light" href="${GH}" rel="noopener">View on GitHub</a><a class="btn outline" href="05-user-guide.html">Read the guide</a></div></div></section></main>${footer()}${tail(index)}`;
fs.writeFileSync(path.join(OUT, 'index.html'), home);
fs.writeFileSync(path.join(OUT, '404.html'), `${head({title: 'Page not found · IntentSutra AI', desc: 'Page not found', canon: `${SITE}/404.html`}).replace('href="assets/', 'href="/intentsutra-ai/assets/')}</head><body>${sprite}<main class="wrap narrow center" style="padding:5rem 0"><h1>Page not found</h1><p class="lead" style="margin-inline:auto">This page does not exist. Unlike a requirement, it has no revision history.</p><p class="cta center"><a class="btn primary" href="/intentsutra-ai/">Back to the home page</a></p></main><script src="/intentsutra-ai/assets/site.js" defer></script></body></html>`);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['', ...pages.map(p => p.slug + '.html'), 'samples/audit/audit-report.html', 'samples/audit-forged/audit-report.html'].map(u => `<url><loc>${SITE}/${u}</loc></url>`).join('')}</urlset>\n`);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
fs.copyFileSync(path.join(PROJECT, 'llms.txt'), path.join(OUT, 'llms.txt'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.mkdirSync(path.join(HERE, 'md-rendered'), {recursive: true});
for (const p of pages) fs.writeFileSync(path.join(HERE, 'md-rendered', p.slug + '.md'), p.raw);
fs.writeFileSync(path.join(HERE, 'README.md'), `# IntentSutra AI — documents\n\nDocumentation website and Markdown set for **IntentSutra AI ${V}**.\n\n- Website source: \`md/\` (Markdown) built by \`build.mjs\` into \`html/\` (light default, dark toggle, responsive)\n- Rendered Markdown with real numbers: \`md-rendered/\`\n- Proof copied beside the pages: \`html/test-results/\`, \`html/samples/\`\n- Rebuild: \`npm run proof && npm run docs:build\`\n\nLive: ${SITE}/ · Repository: ${GH}\n`);
console.log(`built ${pages.length} pages + home + 404`);
