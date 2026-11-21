# Glossary

| Term | Meaning |
|---|---|
| Requirement | A structured statement with stable ID, revision, title, actor, trigger, behavior, constraints and acceptance examples |
| Stable ID | Identity of a requirement that never changes with its title (`REQ-TEAM-001`) |
| Revision | Monotonic integer; increases only when canonical content changes |
| Canonical content | The fields that define a requirement; hashed as sorted-key JSON |
| Source | The imported file a requirement came from; hashed and labelled untrusted |
| Question | An explicit unknown the stakeholders must answer |
| Acceptance criterion | A testable example, drafted as Gherkin and unapproved until a human approves |
| Approval | A local self-attested human decision about an exact revision |
| Evidence link | A pointer from a requirement revision to a code, test, test-run, release, ticket or PR reference |
| Observed file | A workspace file whose SHA-256 was recorded at link time |
| Imported claim | A pass/fail or release outcome supplied by a person; not verified |
| Attestation | A human statement that they reviewed the evidence for a revision |
| Stale | Approval or evidence attached to an older revision; kept as history, no longer counts |
| Drift | A linked file whose current hash differs from the recorded hash |
| Proof by proxy | Treating a ticket, PR, file or status field as proof of completion |
| Audit chain | `audit.jsonl`, each event holding the previous event's hash |
| Seal | SHA-256 of an audit report's canonical content; detects later edits |
| Verdict | `PASS`, `PASS-WITH-FINDINGS` or `FAIL` from the independent audit |
| Self-attested | Identity typed by the user, not verified |
| Skill | A portable `SKILL.md` instruction file for an AI assistant |
| Agent | A named role definition (21 provided); not a running service |
| Workflow | A written execution contract (8 provided) |
| Gate | A rule enforced in code that refuses an action until conditions hold |
| M0..M6 | Milestones from the roadmap |
