# Workflow map

1. **Intake and source trust** — Confirm request scope, origin, workspace and handling policy; ingest only authorized local files.
2. **Discovery and ambiguity review** — Extract goals and candidate requirements; list unknown actors, triggers, constraints and dependencies.
3. **Acceptance and human approval** — Draft Gherkin, challenge edge cases, request explicit human review of exact revision.
4. **Implementation evidence mapping** — Attach code paths and PR/ticket references with source hashes; never infer tests passed.
5. **Test evidence capture** — Attach test files and imported run results; preserve imported-claim trust label.
6. **Version change impact** — Revise requirement and invalidate old approvals/links for current assessment.
7. **Release outcome review** — Attach release evidence and explicit human attestation; retain caveats about imported claims.
8. **Independent audit and reporting** — Run tests, verify hash chain, inspect unapproved and stale states, publish JSON/MD/HTML.
