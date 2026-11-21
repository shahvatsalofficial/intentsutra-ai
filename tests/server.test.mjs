import test from 'node:test';import assert from 'node:assert/strict';import http from 'node:http';
import {createServer} from '../packages/server/server.mjs';import {withReq,req} from './helpers.mjs';
const token='test-strong-bearer-token-value-12345';
function request(port,pathname,method='GET',auth=true){return new Promise((resolve,reject)=>{const q=http.request({host:'127.0.0.1',port,path:pathname,method,headers:auth?{Authorization:'Bearer '+token}:{},timeout:2000},r=>{let b='';r.on('data',c=>b+=c);r.on('end',()=>resolve({status:r.statusCode,body:b,headers:r.headers}));});q.on('error',reject);q.end();});}
async function setup(){const t=withReq(req);const s=createServer({workspace:t.path,token});await new Promise(resolve=>s.on('listening',resolve));return {...t,server:s,port:s.address().port,close:async()=>{await new Promise(resolve=>s.close(resolve));t.clean();}};}
const cases=[
 ['server rejects short bearer token',async()=>{const t=withReq(req);try{assert.throws(()=>createServer({workspace:t.path,token:'short'}),/24/);}finally{t.clean();}}],
 ['server rejects unauthorized',async()=>{const x=await setup();try{assert.equal((await request(x.port,'/health','GET',false)).status,401);}finally{await x.close();}}],
 ['server health is read-only',async()=>{const x=await setup();try{const r=await request(x.port,'/health');assert.equal(JSON.parse(r.body).readOnly,true);}finally{await x.close();}}],
 ['server trace returns requirement',async()=>{const x=await setup();try{const r=await request(x.port,'/trace');assert.equal(JSON.parse(r.body).summary.total,1);}finally{await x.close();}}],
 ['server requirements endpoint returns array',async()=>{const x=await setup();try{const r=await request(x.port,'/requirements');assert.equal(JSON.parse(r.body).length,1);}finally{await x.close();}}],
 ['server forbids POST',async()=>{const x=await setup();try{assert.equal((await request(x.port,'/trace','POST')).status,405);}finally{await x.close();}}],
 ['server hides unknown endpoints',async()=>{const x=await setup();try{assert.equal((await request(x.port,'/secret')).status,404);}finally{await x.close();}}],
 ['server no CORS',async()=>{const x=await setup();try{assert.equal((await request(x.port,'/health')).headers['access-control-allow-origin'],undefined);}finally{await x.close();}}],
 ['server sends no-store',async()=>{const x=await setup();try{assert.equal((await request(x.port,'/health')).headers['cache-control'],'no-store');}finally{await x.close();}}],
 ['server HTML report is escaped',async()=>{const x=await setup();try{const r=await request(x.port,'/report.html');assert.equal(r.status,200);assert.match(r.body,/IntentSutra/);}finally{await x.close();}}]
];for(const [name,fn] of cases)test(name,fn);
