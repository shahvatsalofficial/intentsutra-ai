# Server architecture and deployment gates

## M0 implemented
`node packages/cli/index.mjs serve --workspace /approved/project --token <at-least-24-chars> --port 0`. Binds 127.0.0.1 only. Routes: `/health`, `/trace`, `/requirements`, `/report.md`, `/report.html`. Bearer token, GET-only, no CORS, basic per-minute rate limit. Do not expose publicly.

## Production design (not implemented)
Separate API, auth, policy, evidence and connector workers; PostgreSQL with row-level tenant isolation; OIDC/SAML; RBAC/ABAC; encryption at rest and TLS; KMS; signed append-only audit; secrets manager; background queue; backups/restore; migrations; rate limits; alerting; regional retention; SBOM; SAST/DAST; vulnerability response; IaC drift and rollback.

## Deployment preflight
Human approval, least privilege, threat model, data processing review, real tests and scans, recovery drill, rollout/rollback plan and incident owner. Any failed/unknown gate blocks claims of readiness.
