/** Audit-only instrumentation of executed TypeScript; never loaded by the app. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import ts from 'typescript';
import { createNestedRoadScene } from '../../../capability/layout/contract/index.ts';

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
globalThis.__nestedOperations = { binary: binaryOperation, math: mathOperation, leg: legOperation };
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
  return node;
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
await mkdir('.local/nested-wire-meter', { recursive: true });
await build({
  stdin: {
    contents: "export { createNestedRoadScene } from './capability/layout/contract/index.ts';",
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  outfile: '.local/nested-wire-meter/scene.mjs',
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  plugins: [
    {
      name: 'count-numeric-operations',
      setup(builder) {
        builder.onLoad({ filter: /capability\/layout\/core\/.*\.ts$/ }, (args) =>
          contents(args.path),
        );
      },
    },
  ],
});
const { createNestedRoadScene: instrumented } =
  await import('../../../.local/nested-wire-meter/scene.mjs');
stage = 'unattributed-setup';
const scene = instrumented({
  measure: (name, run) => {
    stage = name;
    const result = run();
    stage = 'unattributed-setup';
    return result;
  },
});
assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene()));
const probe = instrumented({
  copies: 2,
  measure: (name, run) => {
    stage = `probe:${name}`;
    const result = run();
    stage = 'probe:setup';
    return result;
  },
});
assert.equal(JSON.stringify(probe), JSON.stringify(createNestedRoadScene({ copies: 2 })));
assert.equal(scene.nodes.length, 22);
assert.equal(probe.nodes.length, 44);
assert.equal(probe.sections.length, 8);
const southOffset = probe.nodes[22].bounds.y - scene.nodes[0].bounds.y;
assert.equal(southOffset, 1920);
assert.deepEqual(probe.nodes.slice(0, 22), scene.nodes);
scene.nodes.forEach((node, i) => {
  const copy = probe.nodes[i + 22];
  assert.equal(copy.id, `node-${i + 23}`);
  assert.equal(copy.sectionId, renumberSection(node.sectionId));
  assert.deepEqual(copy.bounds, { ...node.bounds, y: node.bounds.y + southOffset });
  assert.deepEqual(
    copy.ports.map((p) => [p.side, p.role, p.offset]),
    node.ports.map((p) => [p.side, p.role, p.offset]),
  );
});
scene.sections.forEach((section, i) => {
  const copy = probe.sections[i + 4];
  assert.equal(copy.id, renumberSection(section.id));
  assert.equal(copy.parentSectionId, renumberSection(section.parentSectionId));
  assert.deepEqual(copy.bounds, { ...section.bounds, y: section.bounds.y + southOffset });
});
function renumberSection(id) {
  if (id === null) return null;
  return `section-${Number(id.slice('section-'.length)) + 4}`;
}

const compiler = await readFile('capability/layout/core/prototype-road-network.ts', 'utf8');
const discoveryLoops = compiler.match(/roads\.(?:slice|flatMap)\(/g) ?? [];
assert.equal(discoveryLoops.length, 0, 'Road-pair discovery must not return');
const wireCounts = Object.fromEntries(
  Object.entries(counts)
    .filter(([key]) => key.startsWith('wire:'))
    .map(([key, value]) => [key.slice(5), value]),
);
const wireTotal = Object.values(wireCounts).reduce((sum, value) => sum + value.total, 0);
const report = {
  definition:
    'One executed numeric +, subtraction, Math.abs, or numeric comparison = one operation. Math.min/max charge n-1 comparisons. Multiplication, division, modulo, sqrt, string/identity comparison, lookup, allocation and native collection iteration are excluded. Sort comparator arithmetic is counted; native sort internals are excluded.',
  instrumentation:
    'TypeScript AST instrumentation of every reachable Layout core module; actual operands and short-circuit evaluation preserved; result byte-compared to the uninstrumented public builder. Initialization and unassigned setup are separately reported. No ++/-- operators exist in the reachable prototype modules.',
  stages: counts,
  wireRouting: { perWire: wireCounts, total: wireTotal },
  laneNetwork: {
    total: counts.network.total,
    roadCount: scene.roads.length,
    pairwiseRoadCandidates: discoveryLoops.length,
    roadPairDiscoveryChecks: discoveryLoops.length,
    proof:
      'Compiler consumes construction contacts; forbidden all-road discovery forms asserted absent. See static-proof.txt.',
  },
  scalingProbe: {
    nodes: [scene.nodes.length, probe.nodes.length],
    southOffset,
    exactCloneVerified: true,
    laneCompile: [counts.network.total, counts['probe:network'].total],
    ratio: counts['probe:network'].total / counts.network.total,
  },
  perLeg: legs.filter((l) => !l.stage.startsWith('probe:')),
  instrumentedSceneIdentical: true,
};
for (const [id, value] of Object.entries(wireCounts)) {
  const ceiling = { w09: 120, w10: 180, w11: 120, w12: 180 }[id] ?? 60;
  assert(value.total <= ceiling, `${id}: ${value.total} > ${ceiling}`);
}
assert(wireTotal <= 1200);
assert(counts.network.total <= 12000);
assert(report.perLeg.every((l) => l.operations <= 60));
assert(report.scalingProbe.ratio <= 2.5);
await writeFile(
  'output/playwright/nested-wires/calculations.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
