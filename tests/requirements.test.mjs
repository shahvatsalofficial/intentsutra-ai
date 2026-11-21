import test from 'node:test';import assert from 'node:assert/strict';
import {normalizeInput,parseMarkdown,unanswered,draftAcceptance,makeRequirement,validateRegistry} from '../packages/core/requirements.mjs';
import {sha256,canonical,hashObject,safeText,escapeHtml,IntentError} from '../packages/core/common.mjs';
import {req} from './helpers.mjs';
const cases=[
 ['normalizes title whitespace',()=>assert.equal(normalizeInput({...req,title:'  A good title  '}).title,'A good title')],
 ['rejects blank title',()=>assert.throws(()=>normalizeInput({...req,title:' '}),/Title/)],
 ['rejects long title',()=>assert.throws(()=>normalizeInput({...req,title:'a'.repeat(201)}),/Title/)],
 ['rejects array requirement',()=>assert.throws(()=>normalizeInput([]),/object/)],
 ['rejects oversized behavior',()=>assert.throws(()=>normalizeInput({...req,behavior:'x'.repeat(4001)}),/long/)],
 ['filters invalid constraint items',()=>assert.deepEqual(normalizeInput({...req,constraints:[' A ',null,42]}).constraints,['A'])],
 ['parses heading',()=>assert.equal(parseMarkdown('# Invite teammates\n\nSome content').title,'Invite teammates')],
 ['parses actor section',()=>assert.equal(parseMarkdown('# Invite teammates\n## Actor\nWorkspace admin').actor,'Workspace admin')],
 ['parses constraints bullets',()=>assert.deepEqual(parseMarkdown('# Invite teammates\n## Constraints\n- Secure\n- Expire').constraints,['Secure','Expire'])],
 ['rough story surfaces missing actor',()=>assert.ok(unanswered(parseMarkdown('# Add team invitations\nAllow roles')).some(x=>x.field==='actor'))],
 ['rough story surfaces permission question',()=>assert.ok(unanswered(parseMarkdown('# Add team invitations with roles')).some(x=>x.field==='authorization'))],
 ['rough story surfaces invitation delivery question',()=>assert.ok(unanswered(parseMarkdown('# Add invitations')).some(x=>x.field==='delivery'))],
 ['fully populated still raises domain questions',()=>assert.ok(unanswered(req).some(x=>x.field==='authorization'))],
 ['candidate acceptance count five',()=>assert.equal(draftAcceptance({...req,acceptance:[]}).length,5)],
 ['candidate criteria contain placeholders',()=>assert.match(draftAcceptance({...req,acceptance:[]})[1].gherkin,/CONFIRM/)],
 ['supplied acceptance remains unapproved',()=>assert.equal(draftAcceptance(req)[0].kind,'stakeholder-supplied-unapproved')],
 ['stable generated requirement id',()=>assert.equal(makeRequirement({...req,id:undefined}).id,makeRequirement(req).id)],
 ['explicit ID is retained',()=>assert.equal(makeRequirement(req,req.id).id,req.id)],
 ['bad ID rejected',()=>assert.throws(()=>makeRequirement(req,'../oops'),/ID/)],
 ['registry duplicate rejected',()=>{const x=makeRequirement(req,req.id);assert.throws(()=>validateRegistry({schemaVersion:'1.0',requirements:[x,x]}),/duplicate/);} ],
 ['registry wrong version rejected',()=>assert.throws(()=>validateRegistry({schemaVersion:'2.0',requirements:[]}),/schema/)],
 ['canonical hashing order invariant',()=>assert.equal(hashObject({a:1,b:2}),hashObject({b:2,a:1}))],
 ['hash is 64 hex',()=>assert.match(sha256('x'),/^[0-9a-f]{64}$/)],
 ['redacts tokens',()=>assert.match(safeText('token=supersecretvalue'),/REDACTED/)],
 ['escapes HTML',()=>assert.equal(escapeHtml('<script>"'), '&lt;script&gt;&quot;')]
];for(const [name,fn] of cases)test(name,fn);
