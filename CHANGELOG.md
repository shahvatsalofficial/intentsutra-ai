# Changelog

## 0.2.1 — 2026-11-23
- Release workflow publishes to npm via trusted publishing (OIDC) from a version tag, including the first publish.
- Regenerated proof and documents.

## 0.2.0 — 2026-11-22
### Added
- `intentsutra audit`: independent audit with 11 checks (hash chain, content hashes, evidence drift, false completion, revision binding, unverified labels, identity claims, registry-vs-log consistency, source provenance, stale evidence, proof-by-proxy gaps). Writes sealed `audit-report.json`, `.md` and `.html`.
- `intentsutra verify --report`, `--version`, `audit --strict` (exit 2 on FAIL).
- `npm run proof`: TAP test log, deterministic fuzzing, scripted CLI transcripts including refusals, honest and forged audit samples, SHA256SUMS.
- `documents/`: 13-page documentation set in Markdown and responsive HTML; GitHub Pages workflow; `llms.txt`; `CITATION.cff`; `NOTICE`; legal and trust page.
- Release, Pages and CI workflows (Node 22/24; Ubuntu, Windows, macOS; npm pack smoke test; secret scan).
### Fixed
- CLI parsed arguments outside its error handler (raw stack trace on stray arguments).
- `--confirm-human` swallowed the following argument when it was not last.
- Invalid JSON, `null` and non-object items in imports threw raw `SyntaxError`/`TypeError`; now `INVALID_JSON`/`INVALID_INPUT`; imports capped at 500 items.
- Symlink tests failed on Windows (`EPERM`); directory links use junctions, file links are skipped when forbidden.
- Package no longer `private`; renamed to unscoped `intentsutra-ai`.

## 0.1.0 — 2026-11-22
Initial offline starter: versioned requirement registry, Markdown/JSON importer, ambiguity questions, draft acceptance criteria, revision invalidation, evidence links, self-attested approvals, traceability reports, local audit chain, read-only localhost API, portable agent/skill/workflow/rule packs and synthetic demo. No public npm/GitHub release has occurred.
