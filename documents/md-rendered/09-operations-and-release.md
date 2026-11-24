# Operations and Release

> Backups, failure modes, the release process, CI and supply chain.

## Runtime
A short-lived CLI. There is no daemon, except the optional `serve` command, which you start and stop yourself.

## Backups and recovery
Back up the whole `.intentsutra/` folder together (registry and `audit.jsonl` must stay in step). Commit it to Git if the content is not sensitive. If `audit` reports AUD-08, a registry edit happened outside the tool: restore both files from the same backup rather than deleting log lines.

## Failure modes
| Failure | Behaviour |
|---|---|
| Crash during a write | writes are atomic (temp file, then rename); the registry is never half-written |
| Audit log edited | mutations refuse with `AUDIT_TAMPER`; `audit` reports FAIL |
| Two processes at once | not supported; last writer wins (documented limit) |
| Evidence file removed | reported `missing-or-unsafe`; AUD-03 fails |

## Observability
Exit codes, JSON on stdout, errors on stderr as `CODE: message`. The audit log is the activity record.

## Release process
1. `npm test` and `npm run proof` pass; proof files regenerated.
2. `npm run docs:build`; commit `docs/proof/` and `documents/`.
3. Bump `package.json`, `CITATION.cff`, `CHANGELOG.md`.
4. Tag `vX.Y.Z`; the Release workflow checks the tag matches the version and publishes to npm with provenance (trusted publishing).
5. First publish of a new package must be done once by hand (`npm publish --access public`); then link the repository and `release.yml` as the trusted publisher on npmjs.com.
6. Create the GitHub release with notes that state limits.

{{svg:ci}}

## CI
`ci.yml`: tests on Ubuntu, Windows and macOS (Node 22/24), doctor, demo, strict audit with seal verification and report upload, `npm pack` clean-install smoke test, secret scan. `pages.yml`: publishes `documents/html/`. `release.yml`: tag-driven npm publish. Third-party Actions are pinned by major version and refreshed by Dependabot.

## Supply chain
Zero runtime dependencies, so no transitive code. The tarball contains only listed files. `npm publish` uses provenance when run from Actions.

## Service levels
None. This is a local developer tool; no uptime, support or response commitments are made. See `SUPPORT.md`.
