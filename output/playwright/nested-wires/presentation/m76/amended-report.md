# M7.6 amended ruling #10 — STOP at screenshot gate

All three implementation items are retained. **DoD-6 is incomplete:** the required open-dropdown screenshot could not be captured headlessly. Do not mark the milestone complete. The original baseline STOP report and commit `5c43d23` remain historical evidence; ruling #10 resolves that earlier conflict.

## Binary gates

| Gate | Result / evidence |
| --- | --- |
| 1 check | PASS: `pnpm check` alone, own server/browser stopped, exit 0; 70 files / 208 tests; no new `*.test.ts`; `pnpm-check-amended.txt` |
| 2 identity | PASS: inherited structural verifier plus full fresh nested/templates/scale bytes equal `d720e7f`; `identity.txt`, `verify-structural-identity.txt` |
| 3 invariants | PASS: unchanged nested suite and topological proof 23/0; templates 130/0; scale 112/0; zero overlaps. Full public road-area audit also executed offline on every scene, zero uncovered/multiply-owned/outside area |
| 4 loads | PASS: scale off 235.7ms <=500; templates off 190.8ms <374.5; scale through roads-on 881.4ms; full samples and stage decomposition in `browser.json` |
| 5 selection | PASS: unchanged assertion body, 183.4ms <=450; all click deltas=0; frozen bounds, wire paths and camera unchanged; `selection.json` |
| 6 screenshots | **FAIL / STOP**: roads off/on and full-width twelve-tab toolbar inspected at 1920×1440. Open native dropdown absent from headless screenshots, despite filename option assertions passing |
| 7 ops | PASS: nested 19,768/992/0; templates 28,443/1,626/0; scale 43,876/2,088/0 exactly. Unchanged meter; `offline-output.txt` and `*-operations.json` |
| 8 README | Recorded below in parent README with before/after, scheduling and limitations |
| 9 delivery | Local logical commits only on feat/m76-lazy-audit; final six-entry log supplied at handoff; no push or PR |

## Timing method and decomposition

Five sequential navigation samples per case, headless Chrome, viewport 1920×1440, own server 5191. Ports 5188/5190 untouched. Roads default off. Roads-on samples explicitly load off, wait for existing ready mark, check Show roads, then wait two frames. The through-on number includes navigation, automation handoff, synchronous audit and those frames; it is not a fabricated initial-on ready mark. User Timing stays outside scene records. Component medians need not sum to overall median.

| Median ms | Scale off | Templates off | Scale on run |
| --- | ---: | ---: | ---: |
| navigation-to-ready (off) | 235.7 | 190.8 | 225.1 |
| styles import | 10.8 | 9.9 | 9.3 |
| renderer import | 2.1 | 1.7 | 1.8 |
| layout total | 7.4 | 4.9 | 7.2 |
| proof catalog | 0.0 | 0.0 | 0.0 |
| render-to-ready | 170.1 | 128.4 | 165.4 |
| coverage audit | **not invoked** | **not invoked** | 545.6 |
| toggle-to-ready incl driver | — | — | 646.1 |
| navigation through roads-on | — | — | 881.4 |

Scale off samples: 259.4, 235.8, 235.7, 227.2, 232.0ms. Templates: 188.4, 190.1, 198.6, 215.1, 190.8ms. Historical baselines are 1,556.7 / 374.5ms, not same-session A/B measurements. No GPU-paint claim. No 150-node certification.

## Screenshot STOP evidence

`dropdown-capture-attempts.json` records headless Chrome and installed Chromium headless shell attempts. Chrome native picker has `:open=true` after click, but both Playwright and direct CDP capture close it (`false`) and omit its menu. Keyboard Space / Alt+ArrowDown also failed to capture options. Chromium headless shell 149 retains `:open=true` across screenshot, yet the image still omits the menu. The images were personally inspected.

- `dropdown-open-attempt.png`: Chrome capture with absent menu — **not** passing evidence.
- `dropdown-headless-shell.png`: shell capture with absent menu — **not** passing evidence.
- `dropdown-alt-arrow.png`: selected value visibly `w22 · catalog.ts → plan.ts`; does not replace the required open-menu screenshot.
- `browser.json`: all 29 templates options use existing filename metadata; nested w01 falls back to node IDs.

No DOM/CSS substitution, composited menu, headed session or application UI redesign was used to manufacture an open-menu screenshot. Resume requires an approved alternative evidence criterion or a headless capture route that includes the actual native popup.

## Visual review and limits

Personally inspected scale off/on, toolbar and dropdown attempts against the required reference rubric. The title stays on one line; two control rows and Show roads are fully inside 1920px. Off has no accounting claim; on shows the actual 3,733,296px² audit. Filenames improve selector meaning; no diagram geometry changed.

Existing M7 benchmark gaps remain: tiny overview labels, dense contract wiring (90 certified crossings against the standing six-crossing budget), and unproven <=40% panel emptiness. Full reference parity is not claimed. User's non-geometry scope prevents repairing those inherited diagram gaps here. No approved reference was changed and no subagent was used.

An additional, nonrequired historical `verify-m45-evidence.py` reconciliation failed comparing old metrics to refreshed calculation artifacts. That failed attempt is retained in `historical-reconciliation-attempt.txt` / `verify-m45-evidence.txt`; no metrics were rebaselined. All required live invariant/identity/ops gates passed separately. The two operation artifacts already modified at task start are preserved byte-for-byte in the evidence commit.

## Replay

Start only `pnpm --dir apps/web exec vite --host 127.0.0.1 --port 5191 --strictPort` for the browser runner. Run `python3 output/playwright/nested-wires/presentation/m76/verify-browser.py`; inspect screenshots manually (runner's behavioral PASS is not screenshot acceptance). Stop own browser/server before `pnpm check`. Offline replay: `python3 output/playwright/nested-wires/presentation/m76/verify-offline.py`.
