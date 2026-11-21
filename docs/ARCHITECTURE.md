# Architecture and ADR overview

## Business and capability architecture
Actors: product owner, BA, engineer, QA, release reviewer, independent auditor. Capabilities: intake, elicitation, versioned requirements, acceptance, approvals, code/test/release evidence, change impact, reporting and audit.

## Logical architecture
`CLI → Core requirements parser → Versioned registry (.intentsutra/requirements.json) → Traceability evaluator → JSON/Markdown/HTML`.

`CLI mutations → hash-chained JSONL audit`.

`Local GET API (127.0.0.1, bearer token) → read-only trace/report projection`.

`IDE assistant → AGENTS.md + portable SKILL.md → reviewed CLI commands`.

No external network or cloud API is required for M0. Agent role files are instructions, not running background processes.

## Data architecture
- `Requirement`: stable ID, revision, canonical content hash, actor/trigger/behavior/constraints/acceptance, questions, history, approval/link/attestation arrays.
- `Approval`: explicit reviewer label, note, exact revision, local self-attestation and `identityVerified:false`.
- `Evidence`: kind, reference, revision, hash (when local file), outcome, provenance and time.
- `Trace`: derived current-revision state; stale evidence listed separately.
- `Audit`: hash chain with previous hash; local tamper indicator, not cryptographic nonrepudiation.

## Status machine
`needs-stakeholder-approval` → `approved-unverified` → `partial-evidence` → `human-review-required` → `human-attested-evidence-linked`.

The final state is **not** automatic feature completion. Changing the requirement revision invalidates current approval and current evidence coverage.

## Infrastructure and operations
Node.js 22+, no runtime dependencies. Local file permissions are best-effort. Single-user/single-process design; no transaction isolation or server-scale database. Optional read-only local API is not public-ready.

## Future enterprise server
Browser → OIDC → API gateway → policy engine/RBAC → requirements service + evidence service + review service → PostgreSQL/object storage; isolated connector workers and append-only external signed audit. Data retention and tenant isolation mandatory. Deployment requires human approval and real security tests.

## ADRs
- ADR-001: Offline deterministic core before optional LLM. Tradeoff: no semantic AI understanding without a host.
- ADR-002: Explicit human approval; no inference from workflow artifacts.
- ADR-003: Revision-bound evidence; old evidence remains historical but stale.
- ADR-004: Import test outcomes as claims, not measured execution.
- ADR-005: Portable skill files with host-specific thin adapters; native activation is unverified.
- ADR-006: Local read-only HTTP API; no remote production server in M0.
