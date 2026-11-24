# Functional Specification

> Scope, personas, numbered functional requirements, traceability states and exit codes.

## Scope
In scope for {{VERSION}}: local Markdown/JSON import, schema validation, deterministic question prompts, reviewable acceptance scenarios, explicit self-attested approval, revision history, evidence links with SHA-256, change impact, traceability reports, independent audit report, audit chain, authenticated loopback read-only API, project-local IDE instruction packs.

Out of scope (planned): natural-language semantic extraction, rich Markdown grammar, executing tests, authenticated stakeholder review, ticketing sync, dashboard, enterprise SSO/RBAC.

## Personas
| Persona | Goal | Primary commands |
|---|---|---|
| Product owner | Turn a rough ask into approved, testable requirements | `ingest`, `review`, `approve` |
| Business analyst | Close open questions, manage revisions | `review`, `revise`, `impact` |
| Engineering lead | Link implementation to a requirement revision | `link --kind code` |
| QA engineer | Record test outcomes without overstating them | `link --kind test|test-run` |
| Release manager | See what is evidenced and what is stale | `trace`, `report` |
| Internal auditor | Verify the record independently | `audit`, `verify` |

## Functional requirements
| ID | Requirement | Verified by |
|---|---|---|
| F-01 | Import `.md`, `.txt` and `.json`; reject anything else; cap input at 2 MiB | security tests |
| F-02 | Assign deterministic stable IDs; re-import of identical content is skipped; same ID with different content is refused (use `revise`) | registry tests |
| F-03 | Generate questions for every missing field and for invitation, role, billing topics | requirements tests |
| F-04 | Generate five candidate scenarios (primary, unauthorized, invalid input, repeat, audit) labelled unapproved | demo test |
| F-05 | `approve` requires reviewer, note, exact current revision, `--confirm-human` | registry tests |
| F-06 | `revise` increments the revision only when canonical content changes; keeps a snapshot | registry tests |
| F-07 | `link` is bound to the current revision; an old revision is rejected | registry tests |
| F-08 | `test` links record the file hash and nothing more; `test-run` and `release` outcomes are labelled not independently verified | registry/audit tests |
| F-09 | `attest` requires current approval, observed code, imported passed test-run and imported release claim | registry tests |
| F-10 | `trace`/`report` write JSON, Markdown, HTML, feature file, questions, assumptions, evidence manifest | security tests |
| F-11 | `audit` writes sealed `audit-report.json/.md/.html`; `verify` checks the seal; `--strict` exits 2 on FAIL | assurance tests |
| F-12 | `serve` binds 127.0.0.1, bearer token of 24+ characters, GET only, no CORS, rate limited | server tests |
| F-13 | `install-ide` copies project-local instructions only; refuses overwrite without `--force` | installer tests |

## Traceability states
| State | Meaning |
|---|---|
| `needs-stakeholder-approval` | No self-attested approval for the current revision |
| `approved-unverified` | Approved; no current evidence |
| `partial-evidence` | Approved; some current evidence |
| `human-review-required` | Approved with code, imported passed test-run and imported release claim; waiting for attestation |
| `human-attested-evidence-linked` | A human attested to the evidence. **Not "completed".** |

{{svg:lifecycle}}

## Exit codes
`0` success · `1` error or refused action · `2` audit verdict FAIL when `--strict` is set.

## Acceptance demo
Input `Add team invitations with roles` yields open questions about authorization, roles, expiry and delivery; five candidate scenarios; five structured requirements; three linked test-file references; and a report showing **no requirement approved or completed**. Revising one requirement makes its old approvals and links stale.
