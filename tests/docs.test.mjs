import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = path.join(root, 'documents/html');
const build = spawnSync(process.execPath, [path.join(root, 'documents/build.mjs')], {encoding: 'utf8'});
const pages = fs.existsSync(html) ? fs.readdirSync(html).filter(f => f.endsWith('.html')) : [];

test('docs site builds', () => assert.equal(build.status, 0, build.stderr));

test('every page is light by default, has a theme toggle and no unresolved placeholders', () => {
  assert.ok(pages.length >= 16, `only ${pages.length} pages`);
  for (const f of pages) {
    const s = fs.readFileSync(path.join(html, f), 'utf8');
    assert.match(s, /<html lang="en" data-theme="light">/, f);
    assert.ok(!/\{\{[^}]*\}\}/.test(s.replace(/<script[\s\S]*?<\/script>/g, '')), `${f} has an unresolved {{ }}`);
    if (f !== '404.html') assert.match(s, /class="icon-btn theme-btn"/, f);
  }
});

test('every internal link and anchor resolves', () => {
  const ids = new Map(pages.map(f => [f, new Set([...fs.readFileSync(path.join(html, f), 'utf8').matchAll(/ id="([^"]+)"/g)].map(m => m[1]))]));
  for (const f of pages) {
    const s = fs.readFileSync(path.join(html, f), 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    for (const [, href] of s.matchAll(/ href="([^"]+)"/g)) {
      if (/^(https?:|#top$|data:|mailto:)/.test(href) || href.startsWith('/intentsutra-ai/')) continue;
      const [file, hash] = href.split('#');
      const target = file || f;
      assert.ok(fs.existsSync(path.join(html, target)), `${f}: missing ${href}`);
      if (hash && target.endsWith('.html')) assert.ok(ids.get(target)?.has(hash), `${f}: missing anchor ${href}`);
    }
  }
});

test('diagrams and charts render on key pages', () => {
  const home = fs.readFileSync(path.join(html, 'index.html'), 'utf8');
  assert.ok((home.match(/<svg class="dia"/g) || []).length >= 2);
  assert.match(fs.readFileSync(path.join(html, '08-test-report.html'), 'utf8'), /class="stack"/);
  assert.match(fs.readFileSync(path.join(html, '14-real-world-scenarios.html'), 'utf8'), /class="flow/);
});
