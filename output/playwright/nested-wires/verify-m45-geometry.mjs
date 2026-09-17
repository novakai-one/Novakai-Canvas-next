/** Audit added junction geometry against the frozen rectangles, through public output only. */
import assert from 'node:assert/strict';
import { createNestedRoadScene, fanInHubSceneSpec } from '../../../capability/layout/contract/index.ts';
const scene = createNestedRoadScene({ spec: fanInHubSceneSpec });
assert(scene.wiring.ok);
const roads = new Map(scene.roads.map((r) => [r.id,r]));
const contains = (p,b) => p.x >= b.x && p.x <= b.x+b.width && p.y >= b.y && p.y <= b.y+b.height;
let audited = 0;
for (const wire of scene.wiring.value) {
  for (const segment of wire.segments) {
    const axis = segment.from.x === segment.to.x ? 'y' : 'x';
    const across = axis === 'x' ? 'y' : 'x';
    const [lo,hi] = [segment.from[axis],segment.to[axis]].sort((a,b)=>a-b);
    const cuts = [lo,hi,...scene.junctions.flatMap(({bounds:b}) => [b[axis], b[axis]+b[axis==='x'?'width':'height']])].filter((v)=>lo<=v&&v<=hi).sort((a,b)=>a-b);
    const road = roads.get(segment.corridorId);
    for (let i=1;i<cuts.length;i+=1) {
      if(cuts[i]===cuts[i-1]) continue;
      const point = {...segment.from,[axis]:(cuts[i]+cuts[i-1])/2};
      if (scene.junctions.some(({bounds})=>contains(point,bounds))) continue;
      if (road.access?.nodeId.startsWith('node-')) continue; // exact planar terminal fans checked by verify-lanes
      const lane = scene.wireLanes.find((l)=>l.wireId===wire.id&&l.roadId===road.id);
      assert(lane, `Unassigned nonjunction segment ${wire.id}/${road.id}`);
      assert.equal(road.axis,axis==='x'?'horizontal':'vertical');
      assert.equal(point[across],road.bounds[across]+road.bounds[axis==='x'?'height':'width']/2+lane.offset);
      audited+=1;
    }
  }
}
console.log(`PASS geometry scope: ${audited} nonjunction/nonterminal intervals lie exactly on their assigned road lanes; turns confined to registered junctions`);
