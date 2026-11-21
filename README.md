# IntentSutra AI

**From Intent to Evidence. From Requirements to Confidence.**

[![CI](https://github.com/shahvatsalofficial/intentsutra-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/shahvatsalofficial/intentsutra-ai/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/intentsutra-ai)](https://www.npmjs.com/package/intentsutra-ai)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
![Dependencies: 0](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)
![Node >=22](https://img.shields.io/badge/node-%3E%3D22-informational)

IntentSutra AI is an open-source, **local-first requirements-to-evidence traceability CLI**. It turns a rough request into versioned requirements with stable IDs and explicit unknowns, records human approvals against the exact revision, links evidence (code, tests, imported results, releases) by SHA-256, marks old approvals and evidence **stale** when a requirement changes, and produces an **independent audit report in Markdown, HTML and JSON**. No API key, no cloud, no telemetry, zero runtime dependencies.

Documentation: **<https://shahvatsalofficial.github.io/intentsutra-ai/>** · Full docs set: [`documents/`](documents/README.md) · Proof: [`docs/proof/`](docs/proof/README.md) · Created by [Vatsal Shah](https://github.com/shahvatsalofficial)

> **What this is not.** IntentSutra gives no legal advice and certifies nothing. It does not run your tests: imported test and release outcomes are labelled *not independently verified*. Local reviewer identity is *self-attested*. It never marks a requirement "completed"; a ticket, PR, test file or imported status is a pointer, not proof. See [Legal and trust](docs/LEGAL_AND_TRUST.md).

## Who it is for
Product owners, business analysts, engineering leads, QA engineers, release managers and internal auditors who need to answer: *what exactly did we agree to build, who approved which version, what evidence supports it, and what changed since?*

## Quick start
```bash
npx intentsutra-ai doctor
```
```bash
npm install -g intentsutra-ai          # installs `intentsutra` and `intentsutra-ai`
mkdir demo && cd demo && intentsutra init
curl -O https://raw.githubusercontent.com/shahvatsalofficial/intentsutra-ai/main/fixtures/team-invitations.json
intentsutra ingest --file team-invitations.json
intentsutra list
intentsutra audit --out audit-out       # audit-report.json, .md and .html
intentsutra verify --report audit-out/audit-report.json
```
From a clone: `npm test`, `npm run doctor`, `npm run demo`, `npm run proof`.

## What you get
| Capability | Command | Output |
|---|---|---|
| Stable requirement IDs, SHA-256 of every source | `ingest` | `.intentsutra/requirements.json` |
| Explicit questions for missing actor, trigger, constraints, authorization, delivery, money | `review` | list, never invented answers |
| Five candidate Gherkin scenarios, marked **unapproved** | `review`, `report` | `acceptance.feature` |
| Human approval of an exact revision | `approve --confirm-human` | self-attested record |
| Evidence links bound to a revision, files hashed | `link` | code, test, test-run, release, ticket, PR |
| Revision history; stale approvals and links preserved | `revise`, `impact` | history snapshots |
| Attestation gate (approval + code + imported pass + imported release) | `attest` | `human-attested-evidence-linked`, never "completed" |
| Traceability reports | `trace`, `report` | JSON, Markdown, HTML, feature file, questions, manifest |
| **Independent audit, 11 checks, sealed** | `audit`, `verify` | `audit-report.json`, `.md`, `.html` |
| Hash-chained audit log | automatic | `.intentsutra/audit.jsonl` |
| 21 agent roles, 26 portable skills, 8 workflows, 9 IDE adapters | `install-ide` | project-local files |
| Read-only loopback API with bearer token | `serve` | JSON over `127.0.0.1` |

## Sample output
Real files produced by this repository's code:
- Audit report: [`docs/proof/audit-sample/audit-report.md`](docs/proof/audit-sample/audit-report.md) · [`.html`](docs/proof/audit-sample/audit-report.html)
- The same workspace after a silent edit, **verdict FAIL**: [`docs/proof/audit-sample-forged/audit-report.md`](docs/proof/audit-sample-forged/audit-report.md)
- Traceability demo: [`examples/reports/demo/`](examples/reports/demo/traceability.md)
- Raw TAP log, fuzz results, CLI transcripts (including refusals): [`docs/proof/`](docs/proof/README.md)

## Safety model (what the code actually enforces)
- **Offline.** No network. The optional API binds `127.0.0.1`, needs a 24+ character bearer token, accepts GET only, sends no CORS headers.
- **Untrusted input.** Requirement text is data and is never executed. Workspace-only regular files, symlinks and oversize files refused, 2 MiB cap, 500-item import cap.
- **Humans decide.** Approval needs a named reviewer, note, the exact revision and `--confirm-human`.
- **Unknown stays unknown.** Missing facts become questions and `[TO CONFIRM]` placeholders.
- **Tamper evidence, honestly labelled.** Hash chains and seals detect edits; they are **not** signatures. A user with write access can rewrite everything.

Read [`SECURITY.md`](SECURITY.md), the [architecture](docs/ARCHITECTURE.md) and the [audit-report guide](docs/AUDIT_REPORTS.md).

## Evidence you can check yourself
```bash
npm test                                   # unit, integration, security, CLI tests
npm run proof                              # TAP log, fuzzing, CLI transcripts, sealed audit reports
node packages/cli/index.mjs verify --report docs/proof/audit-sample/audit-report.json
```
Latest recorded run: [`docs/proof/environment.json`](docs/proof/environment.json) and the [test report](documents/md/08-test-report.md). The audit report lists what was **not** tested, including native execution in every IDE, signatures and legal questions.

## Agents, skills and IDE adapters
The 21 agents and 26 skills are **portable instruction files**, not running services. Adapters for Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo Code and Continue copy them into a project (never into global settings; refuses to overwrite without `--force`). Native activation in each host is **not verified**.
```bash
intentsutra install-ide --host claude --target ./my-project
```

## Status and roadmap
Implemented and tested: registry, revisions, approvals, evidence, stale detection, reports, independent audit, API, installer. **Planned, not built:** real test-execution capture, verified identity, signed audit, dashboard, database, MCP server, connectors. See [STATUS](docs/STATUS.md) and [ROADMAP](ROADMAP.md).

## Documentation
[Executive summary](documents/md/01-executive-summary.md) · [Functional spec](documents/md/02-functional-specification.md) · [Architecture](documents/md/03-architecture.md) · [Technical reference](documents/md/04-technical-reference.md) · [User guide](documents/md/05-user-guide.md) · [Security](documents/md/06-security-and-privacy.md) · [Rules and evidence](documents/md/07-rules-and-evidence.md) · [Test report](documents/md/08-test-report.md) · [Operations](documents/md/09-operations-and-release.md) · [Legal](documents/md/10-legal-and-governance.md) · [Roadmap and FAQ](documents/md/11-roadmap-and-faq.md) · [Glossary](documents/md/12-glossary.md) · [Assurance](documents/md/13-assurance-and-evidence.md)

## Contributing, security, license
[CONTRIBUTING](CONTRIBUTING.md) · [SECURITY](SECURITY.md) · [SUPPORT](SUPPORT.md) · [GOVERNANCE](GOVERNANCE.md) · [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) · Licensed under [Apache-2.0](LICENSE) · [NOTICE](NOTICE) · [Third-party notices](THIRD_PARTY_NOTICES.md). Cite with [`CITATION.cff`](CITATION.cff).

IntentSutra AI is an independent project by Vatsal Shah. It is not affiliated with or endorsed by any IDE vendor, model provider, standards body or regulator. Product names are used only to describe compatibility.
