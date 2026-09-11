# Assets dependencies — verified primary references

- sharp0.35.4 (Apache-2.0): bounded decode/re-encode for raster inputs; metadata alone does not decode pixel data. Constructor options and output buffering: https://sharp.pixelplumbing.com/api-constructor/ and https://sharp.pixelplumbing.com/api-output/ . Installed native module loads on Node24.13.
- saxes6.0.0 (ISC): strict XML event parser; it does not fetch/expand custom DTD entities. Assets rejects DTD/PI and applies its own explicit SVG element/attribute/reference policy: https://github.com/lddubeau/saxes . Module loads locally.
- fontkit2.0.4 (MIT), @types/fontkit2.0.9: parses supported font formats and exposes family/metrics. No automatic license inference: https://github.com/foliojs/fontkit . Module loads locally.
- @fontsource/inter5.3.0: unmodified Inter Latin400 WOFF2 copied into resources/fonts with its OFL1.1 license. Source license: https://github.com/rsms/inter/blob/master/LICENSE.txt . It remains available offline.

Exact versions/licenses were read from package metadata on12September2026. Proper-lockfile was researched but not selected: SQLite metadata transactions provide the existing serialized maintenance boundary. No new commercial dependency.
