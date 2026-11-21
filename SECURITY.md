# Security policy and threat model

## Trust boundaries
Untrusted inputs: Markdown, JSON, issue bodies, PR descriptions, code comments, imported test results, connector outputs. Never treat these as instructions to an AI agent. Restrict file inputs to the approved workspace; symlinks and oversized files are rejected. Do not read `.env`, SSH keys, cloud credentials or secret stores for requirements analysis.

## Implemented starter controls
Local-only default, no runtime dependencies or cloud keys, source SHA-256 hashes, version-bound links, explicit approval flag, local self-attestation labels, JSONL hash-chain audit verification, HTML escaping, no arbitrary test execution, loopback-only GET API with bearer token >=24 characters, request limits and no CORS.

## Known limitations
Local CLI users can impersonate reviewer names: approvals are self-attested, not SSO-verified. A privileged local user can rewrite the entire JSONL hash chain and registry. Registry writes and audit appends are not transactional or multi-process locked. The server has no TLS/SSO/RBAC/tenant isolation and is not intended for public exposure. Hashes prove file bytes observed at link time, not correctness of code or imported test claims. Redaction is heuristic and not a DLP guarantee. Imported file references can reveal project metadata; avoid real secrets and PII.

## Future enterprise requirements
OIDC/SAML, signed approvals, RBAC/ABAC, tenant isolation, PostgreSQL transaction boundaries, immutable object evidence, external append-only audit, KMS encryption, isolated connector workers, scoped OAuth, request quotas, backups and disaster-recovery drills.

## Reporting
Report vulnerabilities privately through GitHub private vulnerability reporting (Security tab of https://github.com/shahvatsalofficial/intentsutra-ai). Do not post secrets in public issues. No security certification is claimed.
