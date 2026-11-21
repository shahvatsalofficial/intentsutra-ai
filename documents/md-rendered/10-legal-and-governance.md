# Legal and Governance

> This page is informational. It is not legal advice. Ask a qualified lawyer about your own situation.

## License
Apache-2.0. You may use, modify and distribute the software, including commercially, subject to the license terms (attribution, notice of changes, no trademark grant, patent license with a retaliation clause). The `NOTICE` file must be preserved in redistributions.

## Third-party code and content
- **Runtime dependencies: 0.** The package uses only Node.js built-ins; there is no bundled third-party code.
- **Fixtures** are synthetic, written for this project, and describe no real company, person or customer.
- Dev tooling (GitHub Actions) is not shipped in the package; see `THIRD_PARTY_NOTICES.md`.

## Trademarks and independence
IntentSutra AI is an independent project by Vatsal Shah. Names such as Claude, Anthropic, Cursor, Codex, OpenAI, GitHub, GitHub Copilot, Gemini, Google, Windsurf, Cline, Roo Code, Continue, Jira, ClickUp, Node.js and npm belong to their owners. They appear only to describe compatibility targets. No affiliation or endorsement is implied. The project name was not trademark-searched; no trademark claim is made.

## What the tool does not provide
| Not provided | Why it matters |
|---|---|
| Legal advice or a compliance opinion | a PASS audit verdict is not a certification (for example ISO, SOC 2, or any regulator's approval) |
| Proof of correctness | hashes show bytes unchanged; imported test results are user claims |
| Verified identity | local approvals are self-attested; there is no SSO or signature |
| Non-repudiation | a privileged user can rewrite local files |

## Using reports as evidence
Reports are useful working papers: they show what was recorded, when, against which revision. They are not a substitute for independent testing or for a signed approval workflow. If an auditor needs stronger assurance, use the planned signed-audit milestone or an external system of record, and keep the independent audit step human.

## Privacy and data protection
The tool processes only data you give it, locally. It sends nothing anywhere. If requirements contain personal data, you remain the controller of that data; keep it out of requirement text, and review reports before sharing.

## Accessibility statement
Reports are semantic HTML with table headers, landmark regions, visible focus, light/dark themes, a print style and no script. WCAG 2.2 is a design reference only; **no conformance is claimed** because no manual or assistive-technology testing has been recorded.

## Accurate-claims policy
Marketing, README and release notes may only use these status labels: `implemented`, `tested-on-<platform>`, `authored-only`, `mock-tested`, `candidate`, `planned`, `not-run`, `blocked`, `unsupported`. Phrases such as "fully compliant", "certified", "production-ready enterprise" or "#1" are not used.

## Governance
Single maintainer (Vatsal Shah) today. Changes by pull request; security issues are handled privately. See `GOVERNANCE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` and `SECURITY.md`. Contributions are accepted under Apache-2.0.

## Citation
Use `CITATION.cff` (GitHub shows a "Cite this repository" button).
