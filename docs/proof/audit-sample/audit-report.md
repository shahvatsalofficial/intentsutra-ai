# IntentSutra AI — Independent Audit Report

**Verdict: PASS** · Project `intent-00700aac2c` · Generated 2026-11-22T18:43:02.982Z

Seal (SHA-256): `813af38b8b1259fe9f434f168a677c1e78e8cab52c646dd00471f7c936547169`

Requirements 5 · Checks 11 · Passed 11 · Failed 0 · Audit events 8 · Human-attested 0

> This is an evidence-integrity review. It is not a certification, a compliance opinion or proof that any requirement is implemented.

## Checks

| ID | Check | Severity | Result | Detail |
| --- | --- | --- | --- | --- |
| AUD-01 | Audit hash chain is intact | critical | PASS | 8 event(s) chain-verified from GENESIS |
| AUD-02 | Requirement content hashes match their recorded fields | high | PASS | 5 requirement(s) re-hashed |
| AUD-03 | Current-revision evidence files still match their recorded SHA-256 | high | PASS | No evidence drift detected |
| AUD-04 | No false completion: every attested requirement has current approval, code, passed test-run and release evidence | critical | PASS | 0 attested requirement(s) re-derived |
| AUD-05 | Approvals and attestations are bound to a valid revision | high | PASS | All approvals/attestations reference existing revisions |
| AUD-06 | Imported test and release claims keep their "not independently verified" label | high | PASS | No imported claim has been upgraded |
| AUD-07 | Approvals never claim a verified identity | high | PASS | All approvals are explicitly self-attested |
| AUD-08 | Registry state is explained by the audit log (no silent edits) | critical | PASS | Every approval, link, attestation and revision has a matching audit event |
| AUD-09 | Source files are classified untrusted and hash-pinned | medium | PASS | All sources carry untrusted-input label and SHA-256 |
| AUD-10 | Stale evidence is visible, not silently reused | info | PASS | 3 stale link(s) preserved as history across 1 requirement(s) |
| AUD-11 | Evidence gaps and proof-by-proxy risks | medium | PASS | No proof-by-proxy gaps found |

## Findings

No findings.
## Requirements

| ID | Rev | State | Stale links | Open questions |
| --- | ---: | --- | ---: | ---: |
| REQ-TEAM-001 | 2 | needs-stakeholder-approval | 3 | 2 |
| REQ-TEAM-002 | 1 | needs-stakeholder-approval | 0 | 2 |
| REQ-TEAM-003 | 1 | needs-stakeholder-approval | 0 | 2 |
| REQ-TEAM-004 | 1 | needs-stakeholder-approval | 0 | 2 |
| REQ-TEAM-005 | 1 | needs-stakeholder-approval | 0 | 2 |

## Limitations

- Local reviewer identity is self-attested; there is no SSO or signature.
- Imported test-run and release outcomes are user-supplied claims; this tool never executes tests.
- The audit chain is tamper-evident for edits, not tamper-proof against a full rewrite.
- Secret redaction is heuristic. A PASS verdict is not a certification, legal opinion or proof that software is correct.

### Per-check limits

- AUD-01: A local hash chain detects edits and mid-file deletion, not truncation of the newest events or a full rewrite by someone with write access.
- AUD-03: A hash match proves the file is unchanged since linking; it does not prove the file demonstrates the requirement.
- AUD-08: Consistency is checked by counts per requirement, not by cryptographic binding of each registry field.
