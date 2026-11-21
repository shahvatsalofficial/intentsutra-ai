import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {init,ingest,approve,link} from '../packages/core/registry.mjs';
import {trace} from '../packages/core/trace.mjs';
import {generate} from '../packages/core/reports.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'intentsutra-demo-'));
fs.mkdirSync(path.join(workspace,'fixtures'));fs.copyFileSync(path.join(root,'fixtures/team-invitations.json'),path.join(workspace,'fixtures/team-invitations.json'));
fs.copyFileSync(path.join(root,'fixtures/rough-request.md'),path.join(workspace,'fixtures/rough-request.md'));
init(workspace);ingest(workspace,'fixtures/team-invitations.json');ingest(workspace,'fixtures/rough-request.md');
const reqs=trace(workspace).requirements;for(const [i,r] of reqs.slice(0,3).entries()){fs.writeFileSync(path.join(workspace,`fixtures/evidence-${i+1}.txt`),`synthetic reference for ${r.id}`);link(workspace,r.id,{kind:'test',ref:`fixtures/evidence-${i+1}.txt`,revision:1});}
const {report,outputs}=generate(workspace,'examples/reports');const target=path.join(root,'examples/reports/demo');fs.mkdirSync(target,{recursive:true});for(const file of Object.values(outputs))fs.copyFileSync(file,path.join(target,path.basename(file)));
console.log(JSON.stringify({requirements:report.summary.total,questionCount:report.summary.unansweredQuestions,linkedTestFiles:3,approved:report.summary.approved,attested:report.summary.humanAttested,states:report.requirements.map(r=>({id:r.id,state:r.state})),reports:target},null,2));
fs.rmSync(workspace,{recursive:true,force:true});
