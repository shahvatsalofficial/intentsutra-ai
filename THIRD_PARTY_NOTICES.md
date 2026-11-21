# Third-party notices

**Runtime dependencies: none.** IntentSutra AI uses only Node.js built-in modules (`node:fs`, `node:path`, `node:os`, `node:crypto`, `node:http`, `node:child_process`, `node:test`, `node:url`).

**Development dependencies: none.** Tests use the built-in `node:test` runner.

**Bundled content:** all code, skills, agents, schemas, rules, workflows, fixtures and documents are original works by Vatsal Shah under Apache-2.0. Sample systems, owners, models and repositories are synthetic. No model weights, datasets, standard text or third-party documents are included.

**Standards and frameworks** (NIST AI RMF, ISO/IEC 42001, OECD AI Principles, EU AI Act) are referenced by name and official link only. Their text is not reproduced. Each belongs to its publisher.

**CI actions used by workflows** (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`) are used from their upstream repositories under their own licenses and are not redistributed in the npm package.

Verify yourself: `npm ls --all` shows no dependencies; `npm pack --dry-run` lists exactly what is published.
