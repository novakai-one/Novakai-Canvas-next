import type { Declaration, Span, Operation } from '../../contract/records/syntax.js';
import type { ResourceRequest, ResolvedResources } from '../../contract/records/requests.js';
import { field, id, text, textOr, optional, type RawRecord } from './fields.js';
import { reject } from '../validation/outcomes.js';
/** Exact theme pin syntax is shared by readouts and resolution, with digest already namespace-qualified. */
export function themePin(theme: ResolvedResources['themes'][string]): string {
  return `${theme.id}@${theme.version}#${theme.digest}`;
}
/** Resolve supplied metadata only; Language never searches a registry or opens a resource source. */
export function resolveTheme(
  alias: string,
  resources: ResolvedResources,
  span: Span,
): ResolvedResources['themes'][string] {
  const direct = resources.themes[alias];
  const found =
    direct ?? Object.values(resources.themes).find((theme) => themePin(theme) === alias);
  if (found === undefined)
    reject(
      'missing-resource',
      span,
      'Supplied exact theme metadata',
      'Theme was not resolved',
      alias,
    );
  checkThemeIdentity(alias, found, span);
  return structuredClone(found);
}
/** An alias maps to its named preset; a pin must match every immutable identity component. */
function checkThemeIdentity(
  alias: string,
  theme: ResolvedResources['themes'][string],
  span: Span,
): void {
  const expected = alias.includes('#') ? themePin(theme) : theme.id;
  if (alias !== expected)
    reject(
      'resource-mismatch',
      span,
      expected,
      'Theme metadata does not match the requested identity',
      alias,
    );
}
/** Asset admission remains an explicit host action; pure compilation just checks its supplied result. */
export function lowerAsset(item: Declaration, resources: ResolvedResources): RawRecord {
  const alias = id(item.fields);
  const record = resources.assets[alias];
  if (record === undefined)
    reject(
      'missing-resource',
      item.span,
      'Admitted asset metadata',
      'Asset has not been admitted',
      alias,
    );
  checkAssetRequest(item, record);
  return structuredClone({ ...record, id: alias, kind: 'image' });
}
/** Image/icon alt text is required; exact digest and authored metadata cannot disagree with admission. */
function checkAssetRequest(item: Declaration, record: ResolvedResources['assets'][string]): void {
  checkAlt(item);
  const source = text(item.fields, 'source');
  if (source.startsWith('sha256:') && source !== record.digest)
    reject(
      'resource-mismatch',
      item.span,
      source,
      'Asset digest differs from admitted bytes',
      id(item.fields),
    );
  ['alt', 'license', 'attribution'].forEach((name) => checkMetadata(item, record, name));
}
/** Font metadata can supply its descriptive alt; image/icon declarations must author accessible text. */
function checkAlt(item: Declaration): void {
  if (text(item.fields, 'kind') === 'font') return;
  if (item.fields.alt === undefined)
    reject(
      'invalid-value',
      item.span,
      'alt="Accessible description"',
      'Image/icon alt text is required',
      id(item.fields),
    );
}
/** Compare requested metadata exactly without guessing or silently rewriting an admitted record. */
function checkMetadata(item: Declaration, record: RawRecord, name: string): void {
  if (item.fields[name] === undefined) return;
  if (field(item.fields, name).value !== record[name])
    reject(
      'resource-mismatch',
      item.span,
      'Matching admitted metadata',
      'Asset metadata differs from admission',
      name,
    );
}
/** Expose descriptive requests so hosts can resolve resources before lowering; no bytes are read here. */
export function assetRequest(item: Declaration): ResourceRequest {
  const kind = text(item.fields, 'kind');
  if (kind !== 'image' && kind !== 'icon' && kind !== 'font')
    reject('invalid-value', item.span, 'image / icon / font', 'Unknown resource kind');
  return {
    kind,
    alias: id(item.fields),
    source: text(item.fields, 'source'),
    ...optional('alt', item.fields.alt?.value),
    ...optional('license', item.fields.license?.value),
    ...optional('attribution', item.fields.attribution?.value),
    span: item.span,
  };
}
/** A document always describes its theme request, including the explicit shared default. */
export function documentResources(item: Declaration): readonly ResourceRequest[] {
  const theme = textOr(item.fields, 'theme', 'paper');
  return [
    { kind: 'theme', alias: theme, source: theme, span: item.span },
    ...item.children.filter((child) => child.kind === 'asset').map(assetRequest),
  ];
}

/** Theme changes and asset additions describe exact admission needs before patch compilation. */
export function patchResources(operation: Operation): readonly ResourceRequest[] {
  if (operation.declaration?.kind === 'asset') return [assetRequest(operation.declaration)];
  if (operation.target !== 'collection') return [];
  return patchThemeRequest(operation);
}
/** Unset theme restores paper; omitted theme does not trigger a new alias resolution. */
function patchThemeRequest(operation: Operation): readonly ResourceRequest[] {
  const theme = operation.fields.theme?.value;
  if (typeof theme === 'string')
    return [{ kind: 'theme', alias: theme, source: theme, span: operation.span }];
  if (operation.properties.includes('theme'))
    return [{ kind: 'theme', alias: 'paper', source: 'paper', span: operation.span }];
  return [];
}
