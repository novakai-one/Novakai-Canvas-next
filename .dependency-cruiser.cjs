/** Dependency Cruiser owns configuration/filesystem failure reporting and rerun recovery. */
const { readdirSync } = require('node:fs');

const boundary = (name) => ({
  name: `${name}-public-surface`,
  severity: 'error',
  from: { pathNot: `^capability/${name}/` },
  to: { path: `^capability/${name}/`, pathNot: `^capability/${name}/contract/index\\.ts$` },
});
const core = (name) => ({
  name: `${name}-core-direction`,
  severity: 'error',
  from: { path: `^capability/${name}/core/` },
  to: {
    pathNot: `^capability/${name}/(core/|contract/(records/|ports/|types\\.ts$|schemas\\.ts$|brands\\.ts$|errors\\.ts$|events\\.ts$))`,
  },
});
const declarations = (name) => ({
  name: `${name}-declarations-no-policy`,
  severity: 'error',
  from: {
    path: `^capability/${name}/contract/(records/|ports/|types\\.ts$|brands\\.ts$|errors\\.ts$)`,
  },
  to: { path: `^capability/${name}/(core/|adapters/|contract/(api|index|compose))` },
});
const tests = (name) => ({
  name: `${name}-tests-public`,
  severity: 'error',
  from: { path: `^capability/${name}/tests/` },
  to: {
    path: `^capability/${name}/`,
    pathNot: `^capability/${name}/(tests/|contract/index\\.ts$|adapters/)`,
  },
});
const adapter = (name) => ({
  name: `${name}-adapter-isolation`,
  severity: 'error',
  from: { path: `^capability/${name}/adapters/` },
  to: { path: `^capability/${name}/(core/|adapters/)`, pathNot: '\\.module\\.css$' },
});
const wiring = (name) => ({
  name: `${name}-adapter-wiring`,
  severity: 'error',
  from: { path: `^capability/${name}/contract/`, pathNot: '/compose\\.ts$' },
  to: { path: `^capability/${name}/adapters/` },
});
const rulesFor = (name) => [
  boundary(name),
  core(name),
  declarations(name),
  tests(name),
  adapter(name),
  wiring(name),
];

module.exports = {
  forbidden: [
    { name: 'no-cycles', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-unresolved', severity: 'error', from: {}, to: { couldNotResolve: true } },
    ...readdirSync('capability').flatMap(rulesFor),
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { conditionNames: ['import', 'default'], exportsFields: ['exports'] },
    exclude: { path: '\\.gitkeep$' },
  },
};
