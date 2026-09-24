/*
 * Themes and assets: the resource requests a source makes, and the check of the host's resolved
 * resources against them. Language never searches a registry or reads resource bytes; the host
 * resolves and admits resources before lowering. No side effects. Language owns correcting the
 * source; Authoring owns commit recovery.
 */
import type { Declaration, Span, Operation } from '../../contract/records/syntax.js';
import type { ResourceRequest, ResolvedResources } from '../../contract/records/requests.js';
import { field, id, text, textOr, optional, type RawRecord } from './fields.js';
import { reject } from '../validation/outcomes.js';

/** The asset attributes that must equal the admitted record when written. */
const checkedMetadata: readonly string[] = ['alt', 'license', 'attribution'];

/**
 * A theme's exact pin, `id@version#digest`. Printing and theme resolution both use it; the
 * digest is already prefixed (for example `sha256:`).
 *
 * @param theme - A resolved theme.
 * @returns The pin text.
 * @throws Never.
 */
export function themePin(theme: ResolvedResources['themes'][string]): string {
  return `${theme.id}@${theme.version}#${theme.digest}`;
}

/**
 * Finds the resolved theme for a written theme: first by alias (the `themes` key), then by exact
 * pin. The written text must then be the theme's ID (for an alias) or its full pin (when it
 * contains `#`).
 *
 * @param alias - The written theme: an alias or a pin.
 * @param resources - The host's resolved resources; only `themes` is read.
 * @param span - Where the theme is written, for diagnostics.
 * @returns A copy of the resolved theme.
 * @throws A `LanguageFault` with a `missing-resource` diagnostic when no theme matches, or a
 * `resource-mismatch` diagnostic when the written text is not the theme's ID or pin.
 */
export function resolveTheme(
  alias: string,
  resources: ResolvedResources,
  span: Span,
): ResolvedResources['themes'][string] {
  const direct = resources.themes[alias];
  const found = direct ?? findPinnedTheme(alias, resources);
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

/**
 * Lowers an asset declaration to the host's admitted asset record, under the written ID. The
 * written `source` (when a `sha256:` digest), `alt`, `license` and `attribution` must match the
 * admitted record, and an image or icon must have `alt` text.
 *
 * @param item - The asset declaration.
 * @param resources - The host's resolved resources; only `assets` is read.
 * @returns A copy of the admitted record with `id` set to the written ID.
 * @throws A `LanguageFault`: `missing-resource` for an asset not admitted, `invalid-value` for an
 * image or icon without `alt`, and `resource-mismatch` for a digest or metadata that differs.
 */
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
  return structuredClone({ ...record, id: alias });
}

/**
 * The resource request for one asset declaration, so the host can resolve and admit it before
 * lowering. No bytes are read here.
 *
 * @param item - The asset declaration.
 * @returns The request: kind, alias (the ID), source, the written `alt`, `license` and
 * `attribution`, and the span.
 * @throws A `LanguageFault` with an `invalid-value` diagnostic for a kind other than `image`,
 * `icon` or `font`, and the faults of reading the ID or source.
 */
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

/**
 * The resource requests of a document: always its theme first (`paper` when not written), then
 * each top-level asset in written order.
 *
 * @param item - The document's collection declaration.
 * @returns The requests.
 * @throws A `LanguageFault` from {@link assetRequest}.
 */
export function documentResources(item: Declaration): readonly ResourceRequest[] {
  const theme = textOr(item.fields, 'theme', 'paper');
  return [
    { kind: 'theme', alias: theme, source: theme, span: item.span },
    ...item.children
      .filter(/** Whether the child is an asset. */ (child) => child.kind === 'asset')
      .map(assetRequest),
  ];
}

/**
 * The resource requests of one patch operation: the asset an operation declares; for a
 * collection target, the theme it sets, or `paper` when it unsets `theme`; otherwise none.
 *
 * @param operation - A parsed patch operation.
 * @returns The requests (at most one).
 * @throws A `LanguageFault` from {@link assetRequest}.
 */
export function patchResources(operation: Operation): readonly ResourceRequest[] {
  if (operation.declaration?.kind === 'asset') return [assetRequest(operation.declaration)];
  if (operation.target !== 'collection') return [];
  return patchThemeRequest(operation);
}

/** The first resolved theme whose pin is exactly `alias`. */
function findPinnedTheme(
  alias: string,
  resources: ResolvedResources,
): ResolvedResources['themes'][string] | undefined {
  return Object.values(resources.themes).find(
    /** Whether this theme's pin is the written text. */ (theme) => themePin(theme) === alias,
  );
}

/** Rejects a written theme that is not the theme's pin (when it has `#`) or else its ID. */
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

/** Checks `alt`, then a `sha256:` source against the admitted digest, then the metadata. */
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
  checkedMetadata.forEach(
    /** Checks one metadata attribute. */ (name) => checkMetadata(item, record, name),
  );
}

/** Rejects an image or icon without `alt`; a font's metadata may supply it. */
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

/** Rejects a written attribute whose value differs from the admitted record's. */
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

/** A set theme asks for that theme; an unset theme asks for `paper`; otherwise nothing. */
function patchThemeRequest(operation: Operation): readonly ResourceRequest[] {
  const theme = operation.fields.theme?.value;
  if (typeof theme === 'string')
    return [{ kind: 'theme', alias: theme, source: theme, span: operation.span }];
  if (operation.properties.includes('theme'))
    return [{ kind: 'theme', alias: 'paper', source: 'paper', span: operation.span }];
  return [];
}
