import http from 'node:http';
import crypto from 'node:crypto';
import {load} from '../core/registry.mjs';
import {trace} from '../core/trace.mjs';
import {markdownReport,htmlReport} from '../core/reports.mjs';
import {IntentError} from '../core/common.mjs';

export function createServer({workspace,token,port=0}){
 if(typeof token!=='string'||token.length<24)throw new IntentError('Bearer token must be at least 24 characters','INVALID_TOKEN');
 const {reg}=load(workspace);const buckets=new Map();const server=http.createServer((req,res)=>{
  const remote=req.socket.remoteAddress??'';const local=['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote);
  const reply=(status,body,contentType='application/json; charset=utf-8')=>{res.writeHead(status,{'content-type':contentType,'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'",'referrer-policy':'no-referrer'});res.end(typeof body==='string'?body:JSON.stringify(body));};
  if(!local)return reply(403,{error:'Loopback clients only'});
  if(req.method!=='GET')return reply(405,{error:'Read-only service'});
  const supplied=req.headers.authorization??'';const a=Buffer.from(supplied),b=Buffer.from('Bearer '+token);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return reply(401,{error:'Unauthorized'});
  const minute=Math.floor(Date.now()/60000),key=remote+':'+minute,used=(buckets.get(key)??0)+1;buckets.set(key,used);if(buckets.size>1000)buckets.clear();if(used>120)return reply(429,{error:'Rate limit exceeded'});
  const pathname=new URL(req.url??'/', 'http://localhost').pathname;
  try{if(pathname==='/health')return reply(200,{status:'ok',readOnly:true,projectId:reg.projectId});const data=trace(workspace);if(pathname==='/trace')return reply(200,data);if(pathname==='/requirements')return reply(200,data.requirements);if(pathname==='/report.md')return reply(200,markdownReport(data),'text/markdown; charset=utf-8');if(pathname==='/report.html')return reply(200,htmlReport(data),'text/html; charset=utf-8');return reply(404,{error:'Not found'});}catch(e){return reply(500,{error:'Report unavailable'});}
 });server.requestTimeout=10000;server.headersTimeout=8000;server.listen(port,'127.0.0.1');return server;
}
