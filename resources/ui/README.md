# Panel layout data

`panels.default.json` is the shipped default arrangement described in baseline document 5. Change section order/side here; each section ID must have a trusted definition and React renderer registered by web composition when implemented. This scaffold does not implement that registry yet.

User layout preferences are separate; upgrading defaults must preserve valid user choices. No functions, JSX, CSS, source paths or domain mutations belong in this file.
