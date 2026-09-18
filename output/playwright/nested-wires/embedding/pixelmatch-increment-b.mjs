import { readFileSync,writeFileSync } from 'node:fs';
import pixelmatch from '/tmp/m10f-b-pixelmatch/node_modules/pixelmatch/index.js';
import { PNG } from '/tmp/m10f-b-pixelmatch/node_modules/pngjs/lib/png.js';
const root='output/playwright/nested-wires/embedding/';
const results={};
for(const roads of ['off','on']){
 const before=PNG.sync.read(readFileSync(root+`increment-b-before-roads-${roads}.png`));
 const after=PNG.sync.read(readFileSync(root+`increment-b-after-roads-${roads}.png`));
 const diff=new PNG({width:before.width,height:before.height});
 const changed=pixelmatch(before.data,after.data,diff.data,before.width,before.height,{threshold:0.1,includeAA:false});
 writeFileSync(root+`increment-b-roads-${roads}-diff.png`,PNG.sync.write(diff));
 results[roads]={width:before.width,height:before.height,threshold:0.1,includeAA:false,changedPixels:changed,totalPixels:before.width*before.height,changedPercent:100*changed/(before.width*before.height)};
}
writeFileSync(root+'increment-b-pixelmatch.json',JSON.stringify(results,null,2)+'\n');console.log(results);
