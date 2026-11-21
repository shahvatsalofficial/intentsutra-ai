# Gemini CLI — IntentSutra AI project-local adapter

**Author:** Vatsal Shah · **Native host activation:** NOT VERIFIED

GEMINI.md and project-local skill docs; check supported extension interface.

## Installation
`node packages/cli/index.mjs install-ide --target /path/to/your/project --host gemini`

This copies instructions, portable skills, agents, rules and workflows under the target project's `intentsutra/` folder. It does **not** change global settings, install plugins, register MCP servers or guarantee native agent invocation.

## Safe fallback
Open the copied `intentsutra/AGENTS.md` and `intentsutra/skills/intentsutra-prime/SKILL.md` in Gemini CLI; ask the host assistant to execute the workflow sequentially and report every unrun step.

## Verify host support
1. Check installed host version and supported instruction/skill paths.
2. Confirm the host actually loads this project's instructions.
3. Run the sample offline CLI and compare evidence IDs.
4. Record version, OS, tested capabilities and unsupported features in `docs/STATUS.md`.

## Restrictions
No global plugin installation or external account connection without human permission. No inferred approvals, tests or releases.
