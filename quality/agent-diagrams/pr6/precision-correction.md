# Collection-origin numeric round trip
Real 24-section DSL create initially rejected at story-1-evidence-lesson: expected y=8151.856968000001, candidate y=8151.856968. Existing geometry tolerance is 1e-6; exact JSON point equality incorrectly rejected native arithmetic. Section bounds now use the existing samePoint predicate; semantic and identity equality remain exact.

Public native round-trip test: 1e-10 origin noise accepted; 0.01 displacement rejected; renamed identity rejected. Red test failed at the noise assertion before the fix; green after it. CLI atlas-integrated-create-2 committed all24 sections, then atlas-composition-preview-4 committed a meaningful grouped composition revision. No canonical JSON or coordinates were authored.
