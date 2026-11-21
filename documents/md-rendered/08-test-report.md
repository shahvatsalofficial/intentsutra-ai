# Test Report

Recorded by `npm run proof` on **2026-11-21T20:41:52.819Z**, Node **v24.15.0**, **win32/x64**, IntentSutra **0.2.0**. Raw output: [test-results/test-run.tap](test-results/test-run.tap). Nothing here is hand-edited.

## Summary
| Suite | Result |
|---|---|
| Automated tests (`node --test`) | 117 total, **115 passed**, 0 failed, 2 skipped |
| Independent audit (honest demo workspace) | 11 checks: 11 passed, 0 failed; verdict `PASS` |
| Independent audit (after silent registry edit) | verdict `FAIL` |
| Fuzzing, fixed seed | 5398 generated inputs; 0 unexpected exceptions or undetected tampering |

The 2 skipped tests create **file** symlinks, which Windows forbids without Developer Mode. They are reported as skipped, not passed. Directory-link tests use junctions and ran.

## Coverage
- **Functional:** import, stable IDs, duplicate import, revision, approval, links, attestation, impact, reports.
- **Proof policy:** approval is never inferred; a ticket or PR is not completion; a test file is not a test pass; a failed imported run is not a pass; a revision invalidates approvals and evidence; linking an old revision is rejected.
- **Security:** traversal, symlink, oversize, HTML and Markdown escaping, tampered audit log, API without token, POST rejected, no CORS, IDE overwrite refused.
- **Audit:** every AUD check has a pass case and a failing case (forged approval, forged identity flag, upgraded label, tampered chain, drifted evidence, edited content, seal tamper).
- **CLI:** exit codes, `--version`, boolean flags before other flags, `--strict`, `verify`.

## Fuzzing
Deterministic seed `20261122`. 3000 mutated requirement records, 1500 Markdown inputs, 300 hostile import files (null, arrays of junk, invalid JSON, empty, wrong shapes), 398 single-character edits of the audit log (all detected) and 200 renders of injection titles through both HTML and Markdown. Only the intended `IntentError` is accepted as a failure mode. See [fuzz-results.json](test-results/fuzz-results.json).

## Defects found and fixed during this review
1. The CLI parsed arguments outside its error handler, so a stray argument printed a raw stack trace. Now a clean error and exit 1.
2. `--confirm-human` consumed the next argument when it was not last, silently turning the approval into a refusal. Boolean flags are now explicit.
3. Invalid JSON, `null`, or non-object items in an import threw raw `SyntaxError`/`TypeError`. They now raise `INVALID_JSON`/`INVALID_INPUT`. Imports are capped at 500 items.
4. Five symlink tests failed on Windows with `EPERM`. They now use junctions for directories and skip file links when the OS forbids them.
5. `audit` printed only a chain status. It now runs 11 checks and writes sealed JSON, Markdown and HTML reports.
6. The package was marked `private` and had no tarball smoke test; both fixed.

An early run of the new fuzz harness reported 20 failures. They were a harness bug (requirement IDs shorter than the 3-character minimum), not a product defect; the harness was fixed, not the result ignored.

## CI matrix
Node 22 and 24 on Ubuntu and Windows, Node 24 on macOS, an `npm pack` clean-install smoke test, and a secret scan. Hosted-runner results appear in the repository Actions tab; they are not part of the local proof.

## Not tested
Native execution in any IDE, signatures, multi-process concurrency, very large registries, accessibility of the HTML reports with assistive technology (structure follows WCAG 2.2 practices, conformance is **not** claimed).

## Reproduce
```bash
git clone https://github.com/shahvatsalofficial/intentsutra-ai && cd intentsutra-ai
npm test && npm run proof
```
