import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {installIde,HOSTS} from '../packages/core/installer.mjs';import {temp,fixture,symlinkSync,run} from './helpers.mjs';
const cases=[
 ['nine host adapters declared',()=>assert.equal(HOSTS.length,9)],
 ['unknown host rejected',()=>{const t=temp();try{assert.throws(()=>installIde(t.path,'unknown'),/Unknown host/);}finally{t.clean();}}],
 ['installs local Claude instruction pack',()=>{const t=temp();try{const r=installIde(t.path,'claude');assert.ok(fs.existsSync(path.join(r.target,'host-adapter','README.md')));assert.equal(r.globalSettingsChanged,false);}finally{t.clean();}}],
 ['installs portable skills',()=>{const t=temp();try{const r=installIde(t.path,'cursor');assert.ok(fs.existsSync(path.join(r.target,'skills','intentsutra-prime','SKILL.md')));}finally{t.clean();}}],
 ['refuses overwrite without force',()=>{const t=temp();try{installIde(t.path,'codex');assert.throws(()=>installIde(t.path,'codex'),/exists/);}finally{t.clean();}}],
 ['force overwrites project-local pack',()=>{const t=temp();try{installIde(t.path,'codex');assert.equal(installIde(t.path,'codex',{force:true}).host,'codex');}finally{t.clean();}}],
 ['refuses symlink target',()=>{const t=temp();try{symlinkSync(t.path,path.join(t.path,'intentsutra'));assert.throws(()=>installIde(t.path,'gemini',{force:true}),/symlink/);}finally{t.clean();}}],
 ['CLI help displays mission',()=>{const r=spawnSync(process.execPath,['packages/cli/index.mjs','help'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(r.status,0);assert.match(r.stdout,/No cloud API key/);} ],
 ['CLI doctor runs without keys',()=>{const r=spawnSync(process.execPath,['packages/cli/index.mjs','doctor'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).offline,true);} ],
 ['CLI unknown command exits nonzero',()=>{const r=spawnSync(process.execPath,['packages/cli/index.mjs','bogus'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(r.status,1);} ]
];for(const [name,fn] of cases)run(name,fn);
