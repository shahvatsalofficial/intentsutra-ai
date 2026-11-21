import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export class IntentError extends Error { constructor(message, code = 'INTENT_ERROR') { super(message); this.name='IntentError'; this.code=code; } }
export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
export const canonical = value => JSON.stringify(sortKeys(value));
function sortKeys(v) { if (Array.isArray(v)) return v.map(sortKeys); if(v && typeof v==='object') return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortKeys(v[k])])); return v; }
export const hashObject = o => sha256(canonical(o));
export const now = () => new Date().toISOString();
export const isPlainObject = v => v!==null && typeof v==='object' && !Array.isArray(v);
export const escapeHtml = v => String(v??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const safeText = (v,max=1000) => String(v??'').slice(0,max).replace(/(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|(?:password|api[_-]?key|token|secret)\s*[:=]\s*\S+)/gi,'[REDACTED]');
export function ensureRegularFile(p,max=2*1024*1024) {const st=fs.lstatSync(p); if(st.isSymbolicLink()||!st.isFile()) throw new IntentError('Refuse non-regular file or symlink','UNSAFE_FILE'); if(st.size>max) throw new IntentError('Input exceeds size limit','TOO_LARGE'); return st;}
export function inside(root, candidate, mustExist=true) {
 const rootReal=fs.realpathSync(root), resolved=path.resolve(rootReal,candidate);
 if(resolved!==rootReal && !resolved.startsWith(rootReal+path.sep)) throw new IntentError('Path escapes approved workspace','PATH_ESCAPE');
 if(mustExist){ const targetReal=fs.realpathSync(resolved); if(targetReal!==rootReal && !targetReal.startsWith(rootReal+path.sep)) throw new IntentError('Symlink escapes approved workspace','PATH_ESCAPE'); ensureRegularFile(resolved); }
 return resolved;
}
export function readFileBounded(file,max=2*1024*1024){ensureRegularFile(file,max);return fs.readFileSync(file,'utf8');}
export function parseJson(text){try{return JSON.parse(text);}catch{throw new IntentError('Invalid JSON','INVALID_JSON');}}
export function readJson(file){return parseJson(readFileBounded(file,5*1024*1024));}
export function writeJsonAtomic(file,data){const dir=path.dirname(file);fs.mkdirSync(dir,{recursive:true});const temp=path.join(dir,`.${path.basename(file)}.${crypto.randomBytes(8).toString('hex')}.tmp`);try{fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
export function writeTextAtomic(file,content){const dir=path.dirname(file);fs.mkdirSync(dir,{recursive:true});const temp=path.join(dir,`.${path.basename(file)}.${crypto.randomBytes(8).toString('hex')}.tmp`);try{fs.writeFileSync(temp,content,{flag:'wx',mode:0o600});fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}}
export function workspaceState(workspace){const root=fs.realpathSync(workspace),dir=path.join(root,'.intentsutra');if(fs.existsSync(dir)&&fs.lstatSync(dir).isSymbolicLink())throw new IntentError('State directory cannot be a symlink','UNSAFE_STATE');return {root,dir,registry:path.join(dir,'requirements.json'),audit:path.join(dir,'audit.jsonl'),reports:path.join(dir,'reports')};}
