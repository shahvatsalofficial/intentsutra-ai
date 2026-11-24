# User Guide

> A complete walk-through from import to a sealed audit report, using the bundled synthetic fixtures.

A complete walk-through using the bundled synthetic fixtures. Every command below was run for real; transcripts are in `samples/`.

{{flow:quickstart}}

## 1. Check the host
```bash
npx intentsutra-ai doctor
```

## 2. Create a workspace and import requirements
```bash
mkdir demo && cd demo
cp <package>/fixtures/team-invitations.json .
intentsutra init
intentsutra ingest --file team-invitations.json
intentsutra list
```
You get five requirements (`REQ-TEAM-001` to `005`). Each shows how many questions are still open.

## 3. Read the unknowns
```bash
intentsutra review --id REQ-TEAM-001
```
Questions are never answered for you. Candidate scenarios contain `[TO CONFIRM]` placeholders; they are **unapproved drafts**.

## 4. Approve (a human decision)
```bash
intentsutra approve --id REQ-TEAM-001 --revision 1 --reviewer "Asha" --note "Reviewed with product owner" --confirm-human
```
Without `--confirm-human`, the exact revision, a reviewer and a note, the command is refused. The record says `identityVerified: false`.

## 5. Link evidence to that revision
```bash
intentsutra link --id REQ-TEAM-001 --revision 1 --kind code --ref src/invite.js
intentsutra link --id REQ-TEAM-001 --revision 1 --kind test-run --ref ci/run-log.txt --outcome passed
intentsutra link --id REQ-TEAM-001 --revision 1 --kind release --ref notes/release.txt --outcome released
```
Files must live inside the workspace and are hashed. The `test-run` and `release` outcomes are what **you** report; the tool does not run anything.

## 6. Attest
```bash
intentsutra attest --id REQ-TEAM-001 --revision 1 --reviewer "Asha" --note "Evidence reviewed by hand" --confirm-human
```
Refused unless approval, code, an imported passed test-run and an imported release claim exist for the current revision. The resulting state is `human-attested-evidence-linked`, never "completed".

## 7. Change the requirement
```bash
intentsutra revise --id REQ-TEAM-001 --file v2.json --revision 1
intentsutra impact --id REQ-TEAM-001
```
Revision 2 is created. The old approval, links and attestation are kept as history and listed as stale. Linking to revision 1 is now refused (`STALE_REVISION`).

## 8. Reports
```bash
intentsutra report --out reports          # traceability: JSON, Markdown, HTML, feature file
intentsutra audit  --out audit-out        # independent audit: JSON, Markdown, HTML
intentsutra verify --report audit-out/audit-report.json
```
Open `audit-out/audit-report.html` in any browser. It is a single responsive file with light and dark themes and a print style.

## 9. Reading an audit verdict
| Verdict | Meaning |
|---|---|
| `PASS` | no failed checks |
| `PASS-WITH-FINDINGS` | only medium or low findings, such as approvals with unanswered questions |
| `FAIL` | a critical or high check failed: broken chain, edited registry, drifted evidence, upgraded label |

Use `--strict` in CI to turn FAIL into exit code 2.

{{svg:ci}}

## 10. Use with an AI coding assistant
```bash
intentsutra install-ide --host claude --target ./my-project
```
Copies instructions into `./my-project/intentsutra/`. It never edits global settings and refuses to overwrite without `--force`.

## Troubleshooting
| Message | Fix |
|---|---|
| `NOT_INITIALIZED` | run `intentsutra init` in the workspace |
| `STALE_REVISION` | read the current revision with `list`, then retry |
| `PATH_ESCAPE` | the file must be inside the workspace |
| `INSUFFICIENT_EVIDENCE` | add the missing approval or evidence for the current revision |
| `AUDIT_TAMPER` | the audit log was edited; restore it from a backup, do not delete lines |
