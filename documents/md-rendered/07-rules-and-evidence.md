# Rules and Evidence Model

## Ten rules
Each rule is a policy. The table separates what **code enforces**, what is **guidance**, and what is **not implemented**, so no rule is overstated.

| Rule | Policy | Enforced by code | Guidance only | Tested | Not implemented |
|---|---|---|---|---|---|
| INT-001 | Human approval | `approve`/`attest` need reviewer, note, exact revision, `--confirm-human` | who counts as a legitimate approver | yes | verified identity |
| INT-002 | Revision-bound evidence | `link` rejects stale revision; old links kept as history; AUD-05 | migration of evidence across revisions | yes | automated migration |
| INT-003 | No completion by proxy | no `completed` state; attest needs four evidence types; AUD-04, AUD-11 | wording in downstream tools | yes | independent execution proof |
| INT-004 | Untrusted content boundary | sources labelled untrusted; text never executed; size caps | agent behavior in IDEs | partly | host-level sandboxing |
| INT-005 | Data minimization | local only; heuristic redaction | what teams choose to import | partly | DLP-grade detection |
| INT-006 | Read-only default | API is GET-only; CLI writes only `.intentsutra/` and chosen report dirs | connector write policy | yes | connectors |
| INT-007 | Provenance | SHA-256 of sources and evidence; provenance labels; AUD-06, AUD-09 | reviewer discipline | yes | signatures |
| INT-008 | Unknown stays unknown | questions; `[TO CONFIRM]`; `unknown` outcomes | stakeholder follow-up | yes | semantic gap detection |
| INT-009 | Independent verification | `audit` re-derives state from raw data and cross-checks the log | an auditor outside the team | yes | verified test execution (M1) |
| INT-010 | Truthful publishing | docs state limits; labels in reports | release review | partly | automated claim linting |

## Evidence kinds
| Kind | Recorded | Hashed | What it can support |
|---|---|---|---|
| `code` | workspace file | yes | "this file existed and had these bytes" |
| `test` | workspace file | yes | "a test file exists" (not that it passed) |
| `test-run` | workspace file + outcome | yes | "a human imported this result" (not independently verified) |
| `release` | workspace file + outcome | yes | "a human imported this release claim" |
| `ticket` | reference text | no | a pointer |
| `pr` | reference text | no | a pointer |

## Trust labels
Future schemas separate `observed-file`, `imported-claim`, `self-attested`, `measured-test`, `verified-external-signature`, `unknown`, `not-run` and `stale`. This release implements the first three plus stale; `measured-test` and `verified-external-signature` are **planned** and are never shown because the code cannot substantiate them.

## Stale evidence
When a revision changes canonical content (`title, actor, trigger, behavior, constraints, acceptance`), older approvals, links and attestations remain in the record for that older revision and no longer count. Reports show the stale count. Nothing is migrated silently.

## The attestation gate
`attest` succeeds only when, for the current revision, there is: an approval, an observed `code` link with matching hash, an imported `passed` test-run, and an imported `released` release claim. The reviewer then confirms by hand. The state name `human-attested-evidence-linked` deliberately avoids "complete".

## Independent audit checks
| ID | Check | Severity |
|---|---|---|
| AUD-01 | audit hash chain intact | critical |
| AUD-02 | content hashes match stored fields | high |
| AUD-03 | evidence files still match recorded hashes | high |
| AUD-04 | no false completion (attested state re-derived) | critical |
| AUD-05 | approvals bound to existing revisions | high |
| AUD-06 | imported claims keep "not independently verified" label | high |
| AUD-07 | approvals never claim verified identity | high |
| AUD-08 | registry state is explained by audit events | critical |
| AUD-09 | sources untrusted-labelled and hash-pinned | medium |
| AUD-10 | stale evidence visible (informational) | info |
| AUD-11 | proof-by-proxy gaps (test file without pass, PR without code, approval with open questions) | medium |
