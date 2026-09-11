# Library plan review — one round

Initial: 2,200 words / 200 lines. One fresh-context reviewer, read-only, completed within eight minutes. No second review.

| Finding | Category | Verification | Correction |
|---|---|---|---|
| Undefined changed semantics | major build risk | Identical replacement and change/revert could yield conflicting no-op outcomes | Compare normalized catalog structure, including array order, excluding projection changes; test 3 covers both |
| Public export wording contradiction | minor | Doc3 excluded functions while Doc1/4 required them | Explicit validate/plan/query plus types/checked IDs |
| Collection hit description/visibility contradiction | minor | Doc2 specified both empty/copied descriptions and omitted collection visibleIn | Collection description copied, visibleIn=[]; section/object meanings explicit |
| Emitted cursor can exceed accepted cursor size (author-found) | major build risk | Allowed large version/recent lists can generate >1MB next cursor | Typed limit without partial page if generated cursor exceeds bound; existing test7 covers limit |

All findings independently verified before this single fix round. Counts before/after are recorded per doc and aggregate; both word and line growth below20%. No extra tests beyond the frozen eight.
