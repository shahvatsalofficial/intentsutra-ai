# Plugin and MCP integration matrix

| Integration | Intended purpose | M0 state | Safety gate |
| --- | --- | --- | --- |
| GitHub Issues / PR | Import metadata and link revision-bound references | Future adapter | Explicit OAuth, least-privilege read scope, no inferred completion |
| ClickUp / Jira | Import tasks and approval references | Future adapter | No writes without human authorization |
| GitHub Spec Kit | Import/export specification artifacts | Candidate only | Versioned mapping and conflict checks |
| OpenSpec | Import change proposals | Candidate only | Preserve provenance and approval |
| Git | Local change impact | Future | Read-only diff, no arbitrary hook execution |
| Playwright | Optional acceptance test execution | Candidate only | Isolated consented test runner, no real production data |
| MCP | Local read-only requirement/trace tools | Schema/design only | Origin auth, explicit tool approval, output validation |
| Google Sheets | Portfolio tracker metadata | External authoring integration, not runtime | No credentials in repository |

No plugins are bundled or globally installed. Connector availability depends on user permissions and installed IDE versions.

## Runtime and host matrix

- **Offline core:** Node.js 22+, zero mandatory runtime dependencies; tested on Linux.
- **Read-only server:** authenticated loopback HTTP, GET-only, no CORS, rate limiting; not enterprise server.
- **IDE adapters:** Claude Code, Cursor, Codex, Gemini CLI, GitHub Copilot, Windsurf, Cline, Roo Code, Continue. Project-local instruction packs and copier; native activation untested.
- **MCP:** design-only, no server runtime.
- **Plugins:** catalogue only; no installations, OAuth or remote writes performed.
