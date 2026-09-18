/** B stop-cost receipt. Counting transform retained verbatim from the A audit; typed rejection is measured, not accepted as a successful admission. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';
import { createNestedRoadScene, preflightNestedSupports, defaultNestedSceneSpec, fanInHubSceneSpec } from '../../../../capability/layout/contract/index.ts';

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('tsx/package.json'))('esbuild');
const binary = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '<': (a, b) => a < b,
  '>': (a, b) => a > b,
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
};
let stage = 'module-initialization';
const counts = {};
const legs = [];
function record(kind, n = 1) {
  counts[stage] ??= { arithmetic: 0, comparisons: 0, total: 0 };
  counts[stage][kind] += n;
  counts[stage].total += n;
}
function numeric(a, b) {
  return typeof a === 'number' && typeof b === 'number';
}
function operationKind(op) {
  return ['+', '-'].includes(op) ? 'arithmetic' : 'comparisons';
}
function binaryOperation(op, a, b) {
  if (numeric(a, b)) record(operationKind(op));
  return binary[op](a, b);
}
function mathOperation(name, ...args) {
  if (name === 'abs') record('arithmetic');
  else record('comparisons', Math.max(0, args.length - 1));
  return Math[name](...args);
}
function legOperation(run) {
  const before = counts[stage]?.total ?? 0;
  const result = run();
  legs.push({ stage, operations: (counts[stage]?.total ?? 0) - before, admitted: result !== null });
  return result;
}
function stageOperation(name, run) {
  const previous = stage; stage = name;
  const value = run(); stage = previous; return value;
}
globalThis.__nestedOperations = { binary: binaryOperation, math: mathOperation, leg: legOperation, stage: stageOperation };
function call(method, args) {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('globalThis'),
        '__nestedOperations',
      ),
      method,
    ),
    undefined,
    args,
  );
}
function instrumentBinary(node) {
  const op = ts.tokenToString(node.operatorToken.kind);
  if (Object.hasOwn(binary, op))
    return call('binary', [ts.factory.createStringLiteral(op), node.left, node.right]);
  if (op === '+=' || op === '-=')
    return ts.factory.createAssignment(
      node.left,
      call('binary', [ts.factory.createStringLiteral(op[0]), node.left, node.right]),
    );
  return node;
}
function instrumentMath(node) {
  const expression = node.expression;
  if (!ts.isPropertyAccessExpression(expression)) return node;
  return mathCall(node, expression);
}
function mathCall(node, expression) {
  if (
    ![ts.isIdentifier(expression.expression), expression.expression.text === 'Math'].every(Boolean)
  )
    return node;
  if (!['abs', 'min', 'max'].includes(expression.name.text)) return node;
  return call('math', [ts.factory.createStringLiteral(expression.name.text), ...node.arguments]);
}
function rewrite(node) {
  if (ts.isFunctionDeclaration(node)) return rewriteDeclaration(node);
  return rewriteExpression(node);
}
function rewriteDeclaration(node) {
  if (node.name?.text === 'lawLeg') return instrumentLeg(node);
  const stages = { retainSupportInput: 'reservation-replay', supportStructure: 'structure', supportPaths: 'paths', supportMouths: 'mouths', admitSupportGraph: 'admission' };
  const name = ownStage(stages, node.name?.text);
  if (name) return instrumentStage(node, name);
  return node;
}
function ownStage(stages, key) {
  return Object.hasOwn(stages, key) ? stages[key] : undefined;
}
function rewriteExpression(node) {
  if (ts.isBinaryExpression(node)) return instrumentBinary(node);
  if (ts.isCallExpression(node)) return instrumentMath(node);
  return node;
}
function instrumentLeg(node) {
  const closure = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    undefined,
    node.body,
  );
  const body = ts.factory.createBlock(
    [ts.factory.createReturnStatement(call('leg', [closure]))],
    true,
  );
  return ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    node.parameters,
    node.type,
    body,
  );
}
function transform(context) {
  const visit = (node) => rewrite(ts.visitEachChild(node, visit, context));
  return (file) => ts.visitNode(file, visit);
}
async function contents(path) {
  const source = ts.createSourceFile(
    path,
    await readFile(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const result = ts.transform(source, [transform]);
  const code = ts.createPrinter().printFile(result.transformed[0]);
  result.dispose();
  return { contents: code, loader: 'ts' };
}
function instrumentStage(node, name) {
  const closure = ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, node.body);
  const body = ts.factory.createBlock([ts.factory.createReturnStatement(call('stage', [ts.factory.createStringLiteral(name), closure]))], true);
  return ts.factory.updateFunctionDeclaration(node, node.modifiers, node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type, body);
}

const bundle = await build({
  stdin: { contents: "export { preflightNestedSupports } from './capability/layout/contract/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, platform: 'node', format: 'esm', packages: 'external', write: false,
  plugins: [{ name: 'count-numeric-operations', setup(builder) {
    builder.onLoad({filter:/capability\/layout\/core\/.*\.ts$/},(args)=>contents(args.path));
  } }],
});
const instrumented = await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const root = 'output/playwright/nested-wires/';
const read = async (file) => JSON.parse(await readFile(root+file,'utf8'));
const specs = {default: defaultNestedSceneSpec,hub:fanInHubSceneSpec,
  templates:await read('templates-scene/scene-spec.json'),scale:await read('scale-scene/scale-scene-spec.json'),authoring:await read('authoring-scene/scene-spec.json')};
function measured(spec) {
  Object.keys(counts).forEach(key=>delete counts[key]);
  const scene=createNestedRoadScene({spec});
  stage='preflight-assembly';
  const result=instrumented.preflightNestedSupports({spec,scene});
  assert.equal(JSON.stringify(result),JSON.stringify(preflightNestedSupports({spec,scene})));
  const travelCount = scene.wireLanes.length;
  const stages=structuredClone(counts);
  const total=Object.values(stages).reduce((sum,n)=>sum+n.total,0);
  const support=total-stages['reservation-replay'].total;
  return {outcome: result.ok ? 'admitted' : result.error, counts: result.ok ? result.value.counts : null,stages,total,support,reservationReplay:stages['reservation-replay'].total,
    pathsPerTravel:stages.paths.total/travelCount,allSupportPerTravel:support/travelCount,
    travelOnlyEstimate:[16*travelCount,64*travelCount],instrumentedByteIdentical:true};
}
const scenes=Object.fromEntries(Object.entries(specs).map(([name,spec])=>{
  const result=measured(spec); assert.deepEqual(result,measured(spec)); return [name,result];
}));
const report={definition:'Same retained AST meter: numeric +, subtraction, comparisons, Math.abs, min/max n-1; excludes multiply/divide, strings, native iteration/map/JSON internals. Separately measured read-only operation, including one authoritative reservation/routing/allocation replay.',scenes};
await writeFile(root+'embedding/increment-b-preflight-operations.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(scenes,null,2));
delete globalThis.__nestedOperations;
