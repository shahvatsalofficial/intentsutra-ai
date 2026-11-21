# Architecture

## Principles
1. **Proof over pointers.** A ticket, PR, file or imported claim is a pointer, not proof.
2. **Revision-bound.** Evidence and approvals attach to an exact requirement revision.
3. **Unknown stays unknown.** Missing facts are questions, never defaults.
4. **Offline and zero dependencies.** Node.js built-ins only; no keys, no telemetry.
5. **Tamper evidence, honestly labelled.** SHA-256 chains and seals detect edits; they are not signatures.

## Layers
| Layer | Implementation in 0.2.0 | Status |
|---|---|---|
| Business | Roles: product owner approves, engineer links, auditor verifies | implemented as process contract |
| Capability | intake, elicitation, versioning, acceptance, approval, evidence graph, impact, reports, audit | implemented |
| Domain | Requirement, Revision, Source, Question, Criterion, Approval, Link, Attestation, Audit | implemented |
| System | CLI, core library, registry file, report engine, loopback API | implemented |
| Component | parser, normalizer, question engine, scenario generator, revision historian, trace evaluator, reporter, audit verifier, assurance auditor, installer | implemented |
| Data | `.intentsutra/requirements.json`, `audit.jsonl`, canonical hashes, immutable history snapshots | implemented |
| Integration | Git, GitHub, ClickUp, Jira, OpenSpec, Spec Kit, CI, MCP | planned (contracts only) |
| Enterprise | OIDC, RBAC, PostgreSQL, signed audit, tenancy | planned |

## Component map
| Module | Responsibility |
|---|---|
| `packages/core/common.mjs` | hashing, canonical JSON, path containment, bounded reads, atomic writes, redaction |
| `packages/core/requirements.mjs` | Markdown parser, normalizer, questions, acceptance drafts, registry validation |
| `packages/core/registry.mjs` | init, ingest, revise, approve, link, attest; every mutation appends an audit event |
| `packages/core/trace.mjs` | per-requirement state, evidence integrity re-check, impact |
| `packages/core/reports.mjs` | JSON, Markdown, HTML traceability and companion artifacts |
| `packages/core/assurance.mjs` | independent audit: 11 checks, severity, seal, JSON/MD/HTML |
| `packages/core/audit.mjs` | hash-chained JSONL log |
| `packages/core/installer.mjs` | project-local IDE instruction packs |
| `packages/server/server.mjs` | read-only authenticated loopback API |
| `packages/cli/index.mjs` | argument parsing, deterministic exit codes |

Dependency direction is strictly `cli/server → core`; core modules never import the CLI.

## Data flow
```text
brief.md / requirements.json
   → ingest (size cap, untrusted label, SHA-256)
   → Requirement rev 1 + questions + draft acceptance
   → approve (human, exact revision)
   → link code / test / test-run / release  (bound to revision, file hashed)
   → attest (needs approval + code + imported pass + imported release)
   → revise → rev 2: approvals and links become stale history
   → trace / report / audit (re-derive; write JSON, MD, HTML)
```

## Key decisions
| ADR | Decision | Reason |
|---|---|---|
| 1 | JSON file registry, not a database | inspectable, diffable, zero dependencies; DB is M5 |
| 2 | Hash-chained JSONL audit | detects edits cheaply; signatures need key management |
| 3 | No `completed` state | prevents completion by proxy |
| 4 | Audit re-derives instead of trusting registry labels | catches forged or edited state |
| 5 | Registry changes must be explained by audit events | detects silent edits (AUD-08) |
| 6 | No test execution in M0 | running untrusted code needs an isolated, opt-in runner (M1) |

## Known limits
No multi-process locking; a privileged local user can rewrite both registry and log; hashes show bytes unchanged, not correctness.
