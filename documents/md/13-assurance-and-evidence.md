# Assurance and Evidence

This page tells a skeptical reader how to check IntentSutra instead of trusting it. It is written from the standpoint of an independent auditor.

## What was independently produced
| Artifact | Where | What it shows |
|---|---|---|
| Raw TAP log | [test-results/test-run.tap](test-results/test-run.tap) | every test name and result: {{PASS}} passed, {{FAIL}} failed, {{SKIPPED}} skipped |
| Fuzz results | [test-results/fuzz-results.json](test-results/fuzz-results.json) | {{FUZZ}} generated inputs; {{TAMPER}} audit-log edits all detected |
| CLI transcripts | `samples/cli-*.txt` | a real lifecycle, including refused actions and exit codes |
| Sample audit, honest | [samples/audit/audit-report.html](samples/audit/audit-report.html) | verdict `{{VERDICT}}`, 11 checks |
| Sample audit, forged | [samples/audit-forged/audit-report.html](samples/audit-forged/audit-report.html) | the same workspace after a silent edit: verdict `{{FORGED}}` |
| Digests | [test-results/SHA256SUMS.txt](test-results/SHA256SUMS.txt) | SHA-256 of each proof file |

The forged sample is the important one: an audit that never fails proves nothing. Here the audit demonstrably fails when state is edited without a matching audit event.

## Verify it yourself in five minutes
```bash
git clone https://github.com/shahvatsalofficial/intentsutra-ai && cd intentsutra-ai
npm test                    # unit, integration, security, CLI tests
npm run proof               # regenerates every proof file from scratch
node packages/cli/index.mjs verify --report docs/proof/audit-sample/audit-report.json
```
Then open `docs/proof/audit-sample-forged/audit-report.html` and read finding AUD-08.

## What a reviewer should challenge
1. **Does the audit trust the registry?** No. It recomputes content hashes, evidence hashes and the attested state from raw data, then cross-checks counts against the audit log.
2. **Could `audit` be gamed by deleting the log?** An empty log with a non-empty registry fails AUD-08. Truncating the newest events is not detectable locally; keep the folder in Git.
3. **Is the seal a signature?** No. It detects modification of a report; anyone can regenerate a new report with a new seal.
4. **Are imported test results trustworthy?** Not by themselves. They are labelled so in every report, and AUD-06 fails if a label is upgraded.

## Not covered (honest list)
Native execution inside any IDE · signatures and key management · multi-process concurrency · legal or regulatory conformance · accessibility conformance testing with assistive technology · behavior on macOS and Linux outside hosted CI · performance at large scale.

## Severity policy
`critical` and `high` failures produce verdict `FAIL` and exit code 2 with `--strict`. `medium` and `low` give `PASS-WITH-FINDINGS`. Informational checks never fail.
