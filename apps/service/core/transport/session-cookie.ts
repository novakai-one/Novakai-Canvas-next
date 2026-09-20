import { browserCookieName } from '../../contract/records/http.js';
/** Cookies ignore ports; name each loopback server independently so opening another app cannot replace its credential. */
export function sessionCookieName(host: string): string {
  return `${browserCookieName}_${encodeURIComponent(host)}`;
}
