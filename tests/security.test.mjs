import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
import {inside,readFileBounded,workspaceState,escapeHtml} from '../packages/core/common.mjs';
import {init,ingest,link,approve} from '../packages/core/registry.mjs';
import {generate,htmlReport,markdownReport} from '../packages/core/reports.mjs';
import {trace} from '../packages/core/trace.mjs';
import {temp,fixture,withReq,req,symlinkSync,run} from './helpers.mjs';
const cases=[
 ['refuses path traversal',()=>{const t=temp();try{assert.throws(()=>inside(t.path,'../outside'),/escapes/);}finally{t.clean();}}],
 ['refuses symlinked input',()=>{const t=temp();try{fixture(t.path,'safe.md','# Hi');symlinkSync(path.join(t.path,'safe.md'),path.join(t.path,'link.md'));assert.throws(()=>readFileBounded(path.join(t.path,'link.md')),/symlink/);}finally{t.clean();}}],
 ['refuses symlinked evidence',()=>{const t=withReq(req);try{fixture(t.path,'code.js','abc');symlinkSync(path.join(t.path,'code.js'),path.join(t.path,'linked.js'));assert.throws(()=>link(t.path,t.id,{kind:'code',ref:'linked.js',revision:1}),/symlink/);}finally{t.clean();}}],
 ['refuses oversized input',()=>{const t=temp();try{fixture(t.path,'big.md','x'.repeat(2*1024*1024+1));assert.throws(()=>readFileBounded(path.join(t.path,'big.md')),/size/);}finally{t.clean();}}],
 ['refuses symlinked state directory',()=>{const t=temp();try{symlinkSync(t.path,path.join(t.path,'.intentsutra'));assert.throws(()=>workspaceState(t.path),/symlink/);}finally{t.clean();}}],
 ['report HTML escapes malicious title',()=>{const t=temp();try{init(t.path);fixture(t.path,'evil.json',JSON.stringify({...req,id:'REQ-XSS-001',title:'<img src=x onerror=alert(1)>'}));ingest(t.path,'evil.json');const html=htmlReport(trace(t.path));assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img/);}finally{t.clean();}}],
 ['markdown escapes pipe in title',()=>{const t=temp();try{init(t.path);fixture(t.path,'evil.json',JSON.stringify({...req,id:'REQ-PIPE-001',title:'A | B'}));ingest(t.path,'evil.json');assert.match(markdownReport(trace(t.path)),/A \\| B/);}finally{t.clean();}}],
 ['report output outside workspace rejected',()=>{const t=withReq(req);try{assert.throws(()=>generate(t.path,'../outside'),/outside/);}finally{t.clean();}}],
 ['report creates seven files',()=>{const t=withReq(req);try{const r=generate(t.path);for(const file of Object.values(r.outputs))assert.ok(fs.existsSync(file));}finally{t.clean();}}],
 ['report JSON valid',()=>{const t=withReq(req);try{const r=generate(t.path);assert.equal(JSON.parse(fs.readFileSync(r.outputs.json)).summary.total,1);}finally{t.clean();}}],
 ['report no conformance claim',()=>{const t=withReq(req);try{assert.match(markdownReport(trace(t.path)),/not an automatic completion/);}finally{t.clean();}}],
 ['rejects unsupported input file extension',()=>{const t=withReq(req);try{fixture(t.path,'script.js','');assert.throws(()=>ingest(t.path,'script.js'),/Only/);}finally{t.clean();}}]
];for(const [name,fn] of cases)run(name,fn);
run('report refuses symlinked parent directory',()=>{const t=withReq(req),other=temp();try{symlinkSync(other.path,path.join(t.path,'out'));assert.throws(()=>generate(t.path,'out/reports'),/Symlink/);}finally{t.clean();other.clean();}});

test('acceptance export explicitly unapproved',()=>{const t=withReq(req);try{const r=generate(t.path);assert.match(fs.readFileSync(r.outputs.acceptance,'utf8'),/UNAPPROVED/);}finally{t.clean();}});
test('open question export preserves requirement ID',()=>{const t=withReq(req);try{const r=generate(t.path);assert.match(fs.readFileSync(r.outputs.questions,'utf8'),new RegExp(t.id));}finally{t.clean();}});
