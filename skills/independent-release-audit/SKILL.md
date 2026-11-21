---
name: independent-release-audit
description: Audit missing evidence and misleading completion states.
---
# IntentSutra Independent Release Audit

**Owner:** Vatsal Shah · **Portable Agent Skill** · **Maturity:** authored skill; native host execution unverified

## When to use
Audit missing evidence and misleading completion states. Use only within the approved workspace and a named requirement revision.

## Required inputs
- Requirement ID, revision and content SHA-256 (or explicitly `not available`)
- Task objective, actor and available source artifacts
- Trust level of source material and human approval status

## Procedure
1. Inspect the request and source origin; identify missing or ambiguous facts.
2. Query the offline CLI or inspect the versioned registry; do not alter user data silently.
3. Produce a candidate analysis tied to the exact revision and relevant evidence hashes.
4. Separate observed facts, user-imported claims, assumptions, and untested work.
5. Request explicit human review for any stakeholder decision, credential, write, external connector, code execution or release.
6. Record unresolved risks and recommend a deterministic verification or human observation.

## Output contract
Return `requirementId`, `revision`, `finding`, `evidence`, `status`, `questions`, `nextAction`, and `reviewerRequired`.

## Prohibited
- Never infer implementation or release completion from tickets, PRs, or code-file existence.
- Never invent approvals, test execution, legal compliance, or verified IDE support.
- Never copy secrets or private issue bodies into reports without review.

## Acceptance checks
- Every finding is reproducible or explicitly `hypothesis`.
- Every reference is revision-bound and has source provenance when available.
- Missing evidence is visibly missing; no green completion from a partial artifact.
