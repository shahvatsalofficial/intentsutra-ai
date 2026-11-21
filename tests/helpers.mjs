import test from 'node:test';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {init,ingest} from '../packages/core/registry.mjs';
export function temp(){const p=fs.mkdtempSync(path.join(os.tmpdir(),'intent-test-'));return {path:p,clean:()=>fs.rmSync(p,{recursive:true,force:true})};}
export function fixture(root,filename,content){fs.writeFileSync(path.join(root,filename),content);return filename;}
export function withReq(input){const t=temp();init(t.path);const f=fixture(t.path,'req.json',JSON.stringify([input]));const x=ingest(t.path,f);return {...t,id:x.added[0]};}
export const req={id:'REQ-TEST-001',title:'User can invite teammate',actor:'Workspace owner',trigger:'Owner sends invitation',behavior:'Invitation is pending',constraints:['No privilege escalation'],acceptance:['Pending invite is visible']};

// Windows needs privilege for file symlinks; directory links use junctions. If neither works, the test is skipped (never faked as passed).
export function symlinkSync(target,p){let type;try{if(fs.statSync(target).isDirectory())type='junction';}catch{}try{fs.symlinkSync(target,p,type);}catch(e){if(e.code==='EPERM'||e.code==='EACCES'){const s=new Error('symlinks not permitted on this host');s.skip=true;throw s;}throw e;}}
export const run=(name,fn)=>test(name,async t=>{try{await fn(t);}catch(e){if(e.skip){t.skip(e.message);return;}throw e;}});
