# Audit reports (Markdown, HTML, JSON)

`intentsutra audit [--out DIR] [--strict]` writes three files with identical content:

| File | Audience |
|---|---|
| `audit-report.html` | people: one responsive file, light/dark, print-ready, no script |
| `audit-report.md` | pull requests, wikis, diffs |
| `audit-report.json` | machines and CI; contains the SHA-256 `seal` |

`intentsutra verify --report audit-report.json` recomputes the seal and exits 1 if the report was modified.

## Checks
AUD-01 chain intact (critical) · AUD-02 content hashes (high) · AUD-03 evidence drift (high) · AUD-04 no false completion (critical) · AUD-05 revision binding (high) · AUD-06 unverified labels kept (high) · AUD-07 no verified-identity claim (high) · AUD-08 registry explained by audit log (critical) · AUD-09 sources untrusted and hash-pinned (medium) · AUD-10 stale evidence visible (info) · AUD-11 proof-by-proxy gaps (medium).

## Verdict
`PASS` no failures · `PASS-WITH-FINDINGS` medium/low only · `FAIL` any critical/high. With `--strict`, FAIL exits 2.

## Samples
docs/proof/audit-sample/ (honest workspace) and docs/proof/audit-sample-forged/ (same workspace after a silent registry edit, verdict FAIL).

## Limits
The seal detects edits to a report; it is not a signature. The audit cannot detect a complete rewrite of registry and log, or truncation of the newest log events. Keep the workspace in Git.
