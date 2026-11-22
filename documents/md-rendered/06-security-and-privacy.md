# Security and Privacy

## Data handling
Everything stays on your machine. There are no network calls, no telemetry and no API keys. The tool reads only files you point it at, inside the workspace, and writes only `.intentsutra/` and report folders you choose.

## Threat model
| Threat | Control in 0.2.1 | Test |
|---|---|---|
| Prompt injection in requirement or issue text | text is data; no LLM in the CLI; source labelled `untrusted-input` | requirements tests |
| Path traversal | `inside()` resolves against the real workspace root and rejects escapes | `refuses path traversal` |
| Symlink escape | symlinks refused for inputs, evidence, state dir, install target, report dir | symlink tests (skipped where the OS forbids creating links) |
| Oversized input | 2 MiB cap (5 MiB registry); import max 500 items | `refuses oversized input` |
| Secret leakage | heuristic redaction of `sk-`, `ghp_`, `password=`-style strings in stored text | unit test |
| Forged reviewer | **not preventable locally**; labelled self-attested, `identityVerified:false`, audited (AUD-07) | assurance tests |
| Evidence substitution | SHA-256 per link; re-checked at trace and audit (AUD-03) | drift test |
| Audit rewriting | hash chain; refuses to append when broken; AUD-01 | tamper test + 398 fuzzed byte edits |
| Silent registry edit | every mutation must have an audit event (AUD-08) | forgery test |
| Stale evidence promotion | link must match current revision; old links are history | revision tests |
| HTML/Markdown injection | all output escaped; pipes escaped in tables | injection tests + 200 fuzzed renders |
| Local API abuse | loopback only, bearer token 24+ chars, GET only, no CORS, rate limit | server tests |
| Malicious test scripts | the tool never executes tests or project code | by design |
| Cross-tenant access | not applicable: single-user local tool | n/a |

## Fuzzing
3000 randomized requirement records and 300 hostile import files produced no exception other than the intended `IntentError`. 398 single-character edits to the audit log were **all** detected. See `test-results/fuzz-results.json`.

## Known limits (read these)
- A user with write access can rewrite both registry and audit log. The chain detects partial edits, not a full rewrite or truncation of the newest events.
- No SSO, no signatures, no multi-process locking.
- Hashes show a file is unchanged since linking. They do not show that it works.
- Secret redaction is heuristic, not data-loss prevention. Do not put real secrets or personal data in requirements.
- The API has no TLS and must not be exposed beyond loopback.

## Reporting a vulnerability
Use GitHub private vulnerability reporting on the repository, or the contact in `SECURITY.md`. Do not post secrets in public issues.

## Privacy
No personal data is collected by the tool. Reviewer names you type are stored in your own registry. Exported reports contain requirement text and file paths; review before sharing.
