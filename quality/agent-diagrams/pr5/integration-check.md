# Integrated routing regression

Source58e5dbd, baseeb07bd1. Full pnpmcheck: static gates pass,173/174tests pass. A valid tree with parent and annotation wire passed correctedPR4 but fails PR5.

`checkTreeAcceptance` in `capability/layout/tests/arrangement.test.ts` requires native success and independent inspection. Failure: constraint-conflict at tree:object:wire:annotation, no valid labelled route in initial+8local+1outside budget. Keep the positive assertion. Root verified failure from actual suite; no code altered during audits.

Original24corpus+6refinedDSL probes succeeded in pre-integration source. Those probes do not excuse the independent fixture failure.
