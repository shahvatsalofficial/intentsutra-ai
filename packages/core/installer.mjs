import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {IntentError} from './common.mjs';
export const HOSTS=['claude','cursor','codex','gemini','copilot','windsurf','cline','roo','continue'];
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function installIde(target,host,{force=false}={}){
 if(!HOSTS.includes(host))throw new IntentError('Unknown host','INVALID_HOST');if(typeof target!=='string'||!target)throw new IntentError('Target required','INVALID_TARGET');if(!fs.existsSync(target))fs.mkdirSync(target,{recursive:true});const root=fs.realpathSync(target);if(!fs.statSync(root).isDirectory())throw new IntentError('Target must be a directory','INVALID_TARGET');const dst=path.join(root,'intentsutra');if(fs.existsSync(dst)){if(fs.lstatSync(dst).isSymbolicLink())throw new IntentError('Target is symlink','UNSAFE_TARGET');if(!force)throw new IntentError('Target exists; use --force to replace after review','EXISTS');}
 fs.mkdirSync(dst,{recursive:true});for(const name of ['AGENTS.md','CLAUDE.md','GEMINI.md','README.md'])fs.copyFileSync(path.join(projectRoot,name),path.join(dst,name));for(const name of ['agents','skills','rules','workflows','schemas'])fs.cpSync(path.join(projectRoot,name),path.join(dst,name),{recursive:true,force});const src=path.join(projectRoot,'adapters/ide',host);fs.cpSync(src,path.join(dst,'host-adapter'),{recursive:true,force});return {host,target:dst,nativeHostExecution:'not-verified',globalSettingsChanged:false};}
