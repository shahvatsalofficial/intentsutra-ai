import {IntentError, hashObject, safeText, isPlainObject, sha256} from './common.mjs';

const clean=v=>typeof v==='string'?safeText(v.trim(),10000):'';
const cleanList=v=>Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>clean(x)).filter(Boolean).slice(0,30):[];
export function normalizeInput(input) {
 if(!isPlainObject(input)) throw new IntentError('Requirement must be an object','INVALID_REQUIREMENT');
 const title=clean(input.title); if(title.length<3||title.length>200)throw new IntentError('Title must be 3-200 characters','INVALID_TITLE');
 const item={title,actor:clean(input.actor),trigger:clean(input.trigger),behavior:clean(input.behavior),constraints:cleanList(input.constraints),acceptance:cleanList(input.acceptance),sourceNote:clean(input.sourceNote)};
 if(item.actor.length>500||item.trigger.length>500||item.behavior.length>4000)throw new IntentError('Field too long','INVALID_FIELD');
 return item;
}
export function parseMarkdown(content) {
 if(typeof content!=='string'||content.length>100000)throw new IntentError('Invalid Markdown input','INVALID_INPUT');
 const lines=content.replace(/\r\n/g,'\n').split('\n'); const sections={};let current='body';sections.body=[];let title='';
 for(const line of lines){const h=line.match(/^#{1,3}\s+(.+?)\s*$/);if(h){if(!title){title=h[1].trim();continue;}const key=h[1].toLowerCase().replace(/[^a-z]+/g,' ').trim();current=key;sections[current]??=[];}else sections[current]??=[],sections[current].push(line);}
 const value=(...names)=>names.map(n=>(sections[n]??[]).join('\n').trim()).find(Boolean)??'';
 const bullets=raw=>raw.split('\n').map(x=>x.replace(/^\s*[-*\d.)]+\s*/,'').trim()).filter(Boolean);
 const body=value('body','request','description');
 return normalizeInput({title:title||body.slice(0,120)||'Untitled request',actor:value('actor','user','persona'),trigger:value('trigger','when'),behavior:value('behavior','expected behavior','outcome')||body,constraints:bullets(value('constraints','rules','business rules')),acceptance:bullets(value('acceptance','acceptance criteria')),sourceNote:'Imported untrusted Markdown; stakeholder confirmation required'});
}
export function unanswered(req) {
 const q=[];
 if(!req.actor)q.push({field:'actor',question:'Who is authorized to perform this task, and which personas are excluded?'});
 if(!req.trigger)q.push({field:'trigger',question:'What event or user action starts the behavior?'});
 if(!req.behavior)q.push({field:'behavior',question:'What observable outcome must occur?'});
 if(!req.constraints?.length)q.push({field:'constraints',question:'What limits, failure conditions, permissions and nonfunctional constraints apply?'});
 if(!req.acceptance?.length)q.push({field:'acceptance',question:'Which stakeholder-approved, independently testable acceptance examples define success?'});
 const t=(req.title+' '+req.behavior).toLowerCase();
 if(/invit|role|permission/.test(t))q.push({field:'authorization',question:'Who can invite whom, assign which roles, revoke invitations, and prevent privilege escalation?'});
 if(/invit|email/.test(t))q.push({field:'delivery',question:'What happens when an invitation expires, is duplicated, is rejected, or delivery fails?'});
 if(/payment|refund|billing/.test(t))q.push({field:'money',question:'What currency, failure recovery, idempotency and authorization rules apply?'});
 return q;
}
export function draftAcceptance(req) {
 if(req.acceptance?.length)return req.acceptance.map((a,i)=>({id:`AC-${String(i+1).padStart(2,'0')}`,kind:'stakeholder-supplied-unapproved',gherkin:`Scenario: ${safeText(a,120)}\n  Given [PRECONDITION TO CONFIRM]\n  When [TRIGGER TO CONFIRM]\n  Then ${safeText(a,300)}`,review:'Requires human approval'}));
 return [
  {id:'AC-01',kind:'candidate',gherkin:`Scenario: Primary outcome\n  Given ${req.actor||'[ACTOR TO CONFIRM]'} has the required access\n  When ${req.trigger||'[TRIGGER TO CONFIRM]'}\n  Then ${req.behavior||'[OBSERVABLE OUTCOME TO CONFIRM]'}`},
  {id:'AC-02',kind:'candidate',gherkin:'Scenario: Unauthorized actor\n  Given [UNAUTHORIZED ACTOR TO CONFIRM]\n  When [ACTION TO CONFIRM]\n  Then [ACCESS CONTROL EXPECTATION TO CONFIRM]'},
  {id:'AC-03',kind:'candidate',gherkin:'Scenario: Invalid input\n  Given [INVALID INPUT TO CONFIRM]\n  When [ACTION TO CONFIRM]\n  Then [ERROR MESSAGE AND RECOVERY TO CONFIRM]'},
  {id:'AC-04',kind:'candidate',gherkin:'Scenario: Repeated action\n  Given [DUPLICATE OR RETRY TO CONFIRM]\n  When [ACTION REPEATS]\n  Then [IDEMPOTENT OR DUPLICATE BEHAVIOR TO CONFIRM]'},
  {id:'AC-05',kind:'candidate',gherkin:'Scenario: Audit and observability\n  Given [ACTOR AND EVENT TO CONFIRM]\n  When [STATE CHANGES]\n  Then [TRACEABLE OUTCOME WITHOUT PERSONAL DATA TO CONFIRM]'}
 ].map(x=>({...x,review:'Unapproved candidate; placeholders are not facts'}));
}
export function makeRequirement(input,providedId){const normalized=normalizeInput(input);const id=providedId??`REQ-${sha256(normalized.title.toLowerCase()+'\n'+normalized.behavior.toLowerCase()).slice(0,10).toUpperCase()}`;
 if(!/^REQ-[A-Z0-9-]{3,40}$/.test(id))throw new IntentError('Invalid requirement ID','INVALID_ID');
 return {id,revision:1,...normalized,contentHash:hashObject(normalized),questions:unanswered(normalized),draftAcceptance:draftAcceptance(normalized),history:[],approvals:[],links:[],attestations:[]};}
export function validateRegistry(reg){if(!isPlainObject(reg)||reg.schemaVersion!=='1.0'||!Array.isArray(reg.requirements))throw new IntentError('Invalid registry schema','INVALID_REGISTRY');const ids=new Set();for(const r of reg.requirements){if(!r.id||ids.has(r.id)||!Number.isInteger(r.revision)||r.revision<1||!Array.isArray(r.links)||!Array.isArray(r.approvals)||!Array.isArray(r.history))throw new IntentError('Invalid or duplicate registry requirement','INVALID_REGISTRY');ids.add(r.id);}return true;}
