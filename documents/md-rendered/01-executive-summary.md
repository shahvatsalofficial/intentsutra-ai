# Executive Summary

**IntentSutra AI** is a local-first, open-source command-line workbench that turns a rough feature request into versioned, reviewable requirements and then keeps an honest record of the evidence behind each one. Its single organizing rule: **it must be harder, not easier, to claim a requirement is complete without real, reviewable proof.** Version 0.2.0, Apache-2.0, created by Vatsal Shah.

## The problem
Teams routinely treat a closed ticket, a merged pull request, a test file or a green status field as proof that a requirement is done. None of these is proof. Approvals get attached to text that later changed. Evidence goes stale silently. Auditors then cannot tell what was actually reviewed, by whom, against which version.

## What IntentSutra does
| Need | What the tool does |
|---|---|
| Capture intent | Imports Markdown or JSON; assigns stable IDs; records the SHA-256 of the source |
| Expose unknowns | Generates explicit questions (actor, trigger, constraints, authorization, delivery failure, money) and never invents answers |
| Draft acceptance | Produces five candidate Gherkin scenarios marked **unapproved**, with `[TO CONFIRM]` placeholders |
| Keep humans accountable | Approval requires a named reviewer, a note, the exact revision and an explicit `--confirm-human` flag |
| Bind evidence to versions | Every link carries the requirement revision; a new revision makes old approvals and links **stale**, preserved as history |
| Detect drift | Re-hashes linked files; a changed file is reported as `hash-mismatch` |
| Prove it independently | `intentsutra audit` re-derives every claim and writes a sealed report as **JSON, Markdown and HTML** |

## What it deliberately does not do
- It never marks a requirement "completed". The strongest state is `human-attested-evidence-linked`.
- It does not execute tests. Imported test-run and release outcomes are labelled **user-imported, not independently verified**.
- Reviewer identity is **self-attested**. There is no SSO and no signature in this release.
- It gives no legal advice and certifies nothing.

## Evidence this release works
Recorded 2026-11-22T18:35:02.198Z on Node v24.15.0 (win32/x64):

| Check | Result |
|---|---|
| Automated tests | 118 total, **116 passed**, 0 failed, 2 skipped |
| Independent audit of the demo workspace | 11 of 11 checks passed; verdict `PASS` |
| Same workspace after a silent registry edit | verdict `FAIL` (forgery detected) |
| Fuzzing, fixed seed | 5398 generated inputs, 0 unexpected exceptions or undetected tampering |

Raw logs, transcripts and sealed sample reports are linked from the [test report](08-test-report) and the [assurance page](13-assurance-and-evidence).

## Who benefits
Product owners and business analysts (clear unknowns and approvals), engineering leads (version-bound traceability), QA engineers (test file is not a test pass), release managers (stale evidence cannot be promoted) and internal auditors (a hash-chained log and a reproducible audit report).

## Maturity, stated plainly
Verified offline starter (milestone M0) plus an independent audit report. Authored but **not** runtime-verified: native activation in the nine supported IDEs, optional MCP/GitHub/Jira connectors. Not built: real test-execution capture, verified identity, signed audit, dashboard, multi-user server. See the [roadmap](11-roadmap-and-faq).
