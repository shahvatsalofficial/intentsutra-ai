# Roadmap and FAQ

> Milestones with honest status, and answers to the questions people ask first.

## Milestones and honest status
| Milestone | Scope | Status |
|---|---|---|
| M0 | offline registry, questions, acceptance drafts, revisions, evidence, reports, loopback API | **implemented**, tested on Windows/Node 24 (see [test report](08-test-report)) |
| M0.2 | independent audit with sealed JSON/Markdown/HTML reports, `verify`, CI smoke test, proof pack | **implemented** in {{VERSION}} |
| M1 | opt-in isolated runner that captures command, commit SHA, environment, exit code, logs and hashes; richer importer | planned |
| M2 | authenticated review (OIDC), tamper-resistant approvals | planned |
| M3 | Git/CI change graph and stale-impact analysis | planned |
| M4 | accessible dashboard with usability testing | planned |
| M5 | PostgreSQL, tenant isolation, encrypted evidence, external signed audit | planned |
| M6 | verified connectors (GitHub, ClickUp, Jira, OpenSpec, Spec Kit), per-IDE activation tests | planned |

Do not read M0 passing as "product released at enterprise grade".

## FAQ
**Does it run my tests?** No. You import the outcome, and it is labelled not independently verified. A runner is M1.

**Why can I never mark a requirement "complete"?** Because a tool cannot know that. It reports what is observed, imported, attested, stale or missing, and a human decides.

**Is the audit a certification?** No. It is an evidence-integrity review of your own records.

**Can someone fake an approval?** With local write access, yes, by editing files. The audit catches silent edits to the registry (AUD-08) and the log (AUD-01) unless the whole record is rewritten. For stronger assurance, keep the folder in Git with protected branches and review.

**Does it need an AI key?** No. Skills and agents are optional instruction files for assistants you already use.

**Do the agents run automatically?** They are portable instruction files. Native activation in each IDE is not verified.

**Windows support?** Yes; tested on Windows. File-symlink tests are skipped there unless Developer Mode is on.

**Which Node versions?** 22 and 24 in CI.

**How do I start with a vague idea?** `ingest` a short Markdown note; read the questions; answer them in a revised file; approve.

**Where is my data?** `.intentsutra/` in your workspace; nothing is uploaded.

**How is this different from a story-writing AI?** It produces fewer words and more accountability: stable IDs, version-bound evidence, human gates and an audit trail.

**Which license?** Apache-2.0.
