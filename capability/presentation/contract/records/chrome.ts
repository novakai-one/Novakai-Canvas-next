/** React-free measurement decisions are supplied by each registered chrome. */
export interface ChromePolicy {
  readonly showKind: boolean;
  readonly sectionLabel?: string | undefined;
}
export type ChromePolicies = Readonly<Record<string, ChromePolicy>>;
