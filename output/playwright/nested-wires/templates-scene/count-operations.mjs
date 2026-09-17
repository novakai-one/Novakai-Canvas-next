/** Audit-only instrumentation of executed TypeScript; never loaded by the app. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import ts from 'typescript';
import { createNestedRoadScene } from '../../../../capability/layout/contract/index.ts';

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
const calls = new Map();
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
  await import('../../../../.local/nested-wire-meter/scene.mjs');
await unlink('.local/nested-wire-meter/scene.mjs');
const spec = JSON.parse(
  await readFile('output/playwright/nested-wires/templates-scene/scene-spec.json', 'utf8'),
);
const probeSpec = {
  ...spec,
  requests: [...spec.requests, ...spec.requests.map((pair) => pair.map((id) => id + 16))],
};
function measured(spec, copies, prefix) {
  stage = `${prefix}setup`;
  return instrumented({
    spec,
    copies,
    measure: (name, run) => {
      stage = `${prefix}${name}`;
      calls.set(stage, (calls.get(stage) ?? 0) + 1);
      const result = run();
      stage = `${prefix}setup`;
      return result;
    },
  });
}
const scene = measured(spec, 1, '');
const probe = measured(probeSpec, 2, 'probe:');
assert.equal(JSON.stringify(scene), JSON.stringify(createNestedRoadScene({ spec })));
assert.equal(
  JSON.stringify(probe),
  JSON.stringify(createNestedRoadScene({ spec: probeSpec, copies: 2 })),
);
assert(scene.wiring.ok && probe.wiring.ok);
assert.equal(scene.nodes.length, 16);
assert.equal(probe.nodes.length, 32);
assert.equal(scene.wiring.value.length, 29);
assert.equal(probe.wiring.value.length, 58);
assert.equal(new Set(probe.nodes.map((n) => n.id)).size, 32);
assert.equal(probe.sections.length, 18);
assert.deepEqual(
  probe.wiring.value.slice(29).map((w) => [w.from, w.to]),
  spec.requests.map((pair) => pair.map((id) => `node-${id + 16}`)),
);
assert([...calls.values()].every((n) => n === 1));
const stageTotal = (prefix, filter) =>
  Object.entries(counts)
    .filter(([name]) => name.startsWith(prefix) && filter(name.slice(prefix.length)))
    .reduce((sum, [, n]) => sum + n.total, 0);
const compileStages = ['wire-registry', 'lane-allocation', 'network', 'lane-projection'];
const compileTotal = (prefix) =>
  compileStages.reduce((sum, name) => sum + counts[prefix + name].total, 0);
const total = stageTotal(
  '',
  (name) => name !== 'module-initialization' && !name.startsWith('probe:'),
);
const clonedTotal = stageTotal('probe:', () => true);
const wireTotal = stageTotal('', (name) => name.startsWith('wire:'));
const compiler = await readFile('capability/layout/core/prototype-road-network.ts', 'utf8');
const discoveryLoops = compiler.match(/roads\.(?:slice|flatMap)\(/g) ?? [];
assert.equal(discoveryLoops.length, 0);
const perLeg = legs.filter((l) => !l.stage.startsWith('probe:'));
const report = {
  definition:
    'Executed numeric +, subtraction, Math.abs and numeric comparisons; min/max charge n-1 comparisons. Multiplication/division, string comparisons, map lookups and native collection iteration/sort internals excluded. Same AST meter as retained M4.5 runner.',
  stages: counts,
  stageInvocations: Object.fromEntries(calls),
  wireRouting: { total: wireTotal },
  compile: {
    total: compileTotal(''),
    components: Object.fromEntries(compileStages.map((name) => [name, counts[name].total])),
  },
  perLeg,
  maxLawLeg: Math.max(...perLeg.map((l) => l.operations)),
  perWireRoadPairDiscovery: 0,
  scalingProbe: {
    nodes: [16, 32],
    wires: [29, 58],
    freshIds: true,
    totalOperations: [total, clonedTotal],
    ratio: clonedTotal / total,
    compileOperations: [compileTotal(''), compileTotal('probe:')],
  },
  instrumentedScenesByteIdentical: true,
};
await writeFile(
  'output/playwright/nested-wires/templates-scene/operations.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  `MEASURE routing=${wireTotal}; maxLawLeg=${report.maxLawLeg}; compile=${report.compile.total}; stages=${JSON.stringify(report.compile.components)}; roadPairDiscovery=0`,
);
console.log(
  `MEASURE 16/32 nodes, 29/58 wires: total ops=${total}/${clonedTotal}; growth=${report.scalingProbe.ratio}`,
);
assert(perLeg.every((l) => l.operations <= 60));
scene.wiring.value.forEach((w) =>
  assert(counts[`wire:${w.id}`].total <= (w.gates.length + 1) * 60),
);
assert(report.scalingProbe.ratio <= 2.5, 'Compounding clone growth: STOP');
console.log(
  'PASS max law leg <=60; per-wire ceiling; clone total growth <=2.5; instrumented byte identity; every stage once',
);
