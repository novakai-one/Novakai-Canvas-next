/** Unchanged AST meter and ceilings, plus explicit accounting of B's setup-stage support work. */
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {defaultNestedSceneSpec} from '../../../../capability/layout/contract/index.ts';
const root='output/playwright/nested-wires/';
mkdirSync('.local/m10f-c',{recursive:true});
writeFileSync('.local/m10f-c/default-spec.json',JSON.stringify(defaultNestedSceneSpec));
const rows={};
const historical={default:16018,hub:19768,templates:28443,scale:43876,authoring:103171};
for(const name of ['default','hub','templates','scale','authoring']){
 const config={directory:root+'embedding',outputFile:`increment-c-${name}-builder-operations.json`};
 if(name==='hub')config.nested=true;
 else config.specFile=name==='default'?'.local/m10f-c/default-spec.json':root+`${name}-scene/${name==='scale'?'scale-scene-spec':'scene-spec'}.json`;
 const output=execFileSync('node',['--import','tsx',root+'templates-scene/count-operations.mjs',JSON.stringify(config)],{encoding:'utf8'});
 writeFileSync(root+`embedding/increment-c-${name}-operations.txt`,output);
 const a=JSON.parse(readFileSync(root+`embedding/increment-a-${name}-builder-operations.json`));
 const b=JSON.parse(readFileSync(root+`embedding/increment-c-${name}-builder-operations.json`));
 const saved=JSON.parse(readFileSync(root+`embedding/increment-b-operation-summary.json`)).scenes[name];
 const addedSetup=b.stages.setup.total-a.stages.setup.total;
 const total=b.compile.total+addedSetup;
 rows[name]={before:saved.after,after:{legacyCompile:b.compile.total,addedSetupSupport:addedSetup,accountedCompile:total,routing:b.wireRouting.total,discovery:b.perWireRoadPairDiscovery,allBuilderOperations:b.scalingProbe.totalOperations[0]},compileDeltaVsB:total-saved.after.accountedCompile,compileDeltaVsRuling10:total-historical[name],doubledGrowth:b.scalingProbe.ratio,stages:a.stageInvocations&&b.stageInvocations};
 console.log(name,JSON.stringify(rows[name]));
}
writeFileSync(root+'embedding/increment-c-operation-summary.json',JSON.stringify({definition:'The unchanged meter compile subtotal covers registry/allocation/network/projection. C additionally executes support/solve/materialization in setup; accountedCompile adds the exact setup increase versus A. All builder operations and fresh-ID growth include every stage. No revised ceiling or acceptance assertion.',scenes:rows},null,2)+'\n');
