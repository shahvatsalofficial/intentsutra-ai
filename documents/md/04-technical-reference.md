# Technical Reference

> Install, every command and flag, data files, the audit report schema, the loopback API and error codes.

## Requirements
Node.js 22 or newer. No runtime dependencies. Works on Windows, macOS and Linux (see [test report](08-test-report) for what was actually run).

## Install
```bash
npx intentsutra-ai doctor
npm install -g intentsutra-ai        # installs `intentsutra` and `intentsutra-ai`
```

## Commands
| Command | Purpose |
|---|---|
| `init` | create `.intentsutra/` in the workspace |
| `ingest --file F` | import `.md`, `.txt` or `.json` (object, array, or `{requirements: []}`; max 500 items) |
| `list` / `review --id` | list requirements; show questions and draft acceptance |
| `revise --id --file --revision N` | new revision when canonical content changed |
| `approve --id --revision N --reviewer --note --confirm-human` | self-attested approval |
| `link --id --revision N --kind K --ref R [--outcome O]` | evidence link; kinds `code test test-run release ticket pr` |
| `attest --id --revision N --reviewer --note --confirm-human` | human attestation of linked evidence |
| `trace` / `impact --id` | derived state; stale approvals and links |
| `report [--out DIR]` | traceability JSON, MD, HTML, feature file, questions, assumptions, manifest |
| `audit [--out DIR] [--quiet] [--strict]` | independent audit: `audit-report.json`, `.md`, `.html` |
| `verify --report FILE` | check an audit report seal |
| `serve [--token T] [--port P]` | read-only loopback API (also `INTENTSUTRA_TOKEN`) |
| `install-ide --target DIR --host H [--force]` | project-local instruction pack |
| `doctor`, `--version`, `help` | diagnostics |

Boolean flags (`--confirm-human`, `--force`, `--quiet`, `--strict`) never consume the next argument.

## Outcome values
`test-run`: `passed | failed | unknown`. `release`: `released | blocked | unknown`.

## Provenance labels
| Label | Meaning |
|---|---|
| `local-file-hash-observed` | the file existed in the workspace and its SHA-256 was recorded |
| `user-imported-test-result-not-independently-verified` | a human supplied a pass/fail; nothing ran |
| `user-imported-release-claim-not-independently-verified` | a human supplied a release claim |
| `unverified-reference` | ticket or PR text; a pointer only |

## Data files
| File | Content |
|---|---|
| `.intentsutra/requirements.json` | registry (schema 1.0): requirements, history, approvals, links, attestations |
| `.intentsutra/audit.jsonl` | one JSON event per line, each with `prevHash` and `hash` (SHA-256 of canonical JSON) |
| `.intentsutra/reports/` | default report folder |

Hash input is canonical JSON (keys sorted recursively), so the same content always hashes the same.

## Audit report schema (1.0)
`{schemaVersion, tool, generatedAt, projectId, verdict, summary{requirements, checks, passed, failed, bySeverity, attested, auditEvents, auditChainHead}, checks[{id,title,severity,status,failures,note,limitation}], requirements[], limitations[], seal}`. `seal` is the SHA-256 of the canonical report without the seal.

## API (loopback, read-only)
`GET /health`, `/trace`, `/requirements`, `/report.md`, `/report.html`. Header `Authorization: Bearer <token>`, token of 24+ characters. Non-loopback peers get 403, non-GET 405, no CORS, `Cache-Control: no-store`, 120 requests per minute per peer.

## Programmatic use
```js
import {init, ingest, approve, link} from 'intentsutra-ai/packages/core/registry.mjs';
import {runAudit} from 'intentsutra-ai/packages/core/assurance.mjs';
```
The library API is not yet covered by a semver stability promise; the CLI and file formats are.

## Error codes
`NOT_INITIALIZED, ALREADY_INITIALIZED, NOT_FOUND, APPROVAL_REQUIRED, ATTESTATION_REQUIRED, INSUFFICIENT_EVIDENCE, STALE_REVISION, INVALID_KIND, INVALID_OUTCOME, INVALID_JSON, INVALID_INPUT, UNSUPPORTED_INPUT, PATH_ESCAPE, UNSAFE_FILE, TOO_LARGE, ID_CONFLICT, AUDIT_TAMPER`.
