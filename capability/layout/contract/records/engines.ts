/** Native adapter and policy versions share one authority; custom providers still supply their own explicit versions. */
export const nativeEngineVersions = Object.freeze({
  placement: 'elk-0.12.0/layout-2',
  solver: 'lume-kiwi-0.4.4/layout-1',
  routing: 'libavoid-js-0.5.0-beta.5/layout-1',
  policy: 'layout-policy-6',
});
export const defaultEngineVersions: readonly string[] = Object.freeze([
  nativeEngineVersions.placement,
  nativeEngineVersions.solver,
  nativeEngineVersions.routing,
  nativeEngineVersions.policy,
]);
