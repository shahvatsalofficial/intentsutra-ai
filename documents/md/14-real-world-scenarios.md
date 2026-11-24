# Real-World Scenarios

> Seven situations every product team recognises, each as a step-by-step flowchart. All commands shown were run for real; the transcripts are in the proof pack.

Each scenario follows the same pattern: what happens, what the tool does, and what stays a human decision. Colour in the flowcharts means: **red** is a problem found, **amber** needs a person, **green** is a good outcome.

## Quick start in four steps

{{flow:quickstart}}

## Scenario 1: The one-line feature request

**Situation.** A ticket reads "Add team invitations with roles". Everyone in the meeting agrees. Nobody has actually decided who may invite whom, what happens when an email bounces, or whether an invitation expires.

{{flow:vague}}

**What you get.** Five candidate scenarios (primary path, unauthorized actor, invalid input, repeat action, audit) with `[TO CONFIRM]` placeholders, and a list of open questions. The tool never invents policy.

**Still human.** Answering the questions and approving the revision.

## Scenario 2: The rule changed after sign-off

**Situation.** Revision 1 was approved, built and released. A month later the product owner decides invitations must expire after 7 days. Typical tools keep showing the old approval as valid.

{{flow:stale}}

{{svg:stale}}

**What you get.** An exact list of what no longer counts, and a hard refusal to attach old evidence to the wrong revision.

**Still human.** Re-approving revision 2 and linking fresh evidence.

## Scenario 3: "Tests are linked" is not "tests passed"

**Situation.** A status page shows three requirements with linked tests and a merged PR. It feels done. It is not proven.

{{flow:proxy}}

**What you get.** Audit finding AUD-11 naming each gap: a test file without a passed run, a PR without observed code, an approval with open questions.

**Still human.** Deciding whether an imported run log is credible enough, and attesting.

## Scenario 4: Someone edited the record by hand

**Situation.** Before a release review, somebody opens `requirements.json` and adds an approval to make a red requirement turn green. No command was used, so no audit event exists.

{{flow:forged}}

{{svg:audit}}

**What you get.** Critical finding AUD-08, verdict **FAIL**, and exit code 2 with `--strict`. The proof pack contains a real sealed report of exactly this case.

**Still human.** Investigating why, and restoring both files from the same backup.

## Scenario 5: The auditor's request

**Situation.** An internal auditor asks how a requirement was approved. They want the record, not a slide.

{{flow:auditor}}

**What you get.** A single sealed HTML report for reading and a JSON twin for tooling, and a command that proves neither was edited afterwards.

**Still human.** Judging whether self-attested identity and imported results are enough assurance for this decision.

## Scenario 6: An AI assistant helps, and stops at the gate

**Situation.** A developer asks an assistant to check requirements before release.

{{flow:assistant}}

> **Note** The 21 agents and 26 skills are instruction files, not services. Native activation in each IDE has not been verified. Without an assistant, every step above works from the command line.

**What you get.** Deterministic output from the real CLI, gaps listed, and no way for the assistant to approve or attest on anyone's behalf.

## Scenario 7: Friday release review

**Situation.** Twelve requirements are in scope. The release manager runs the audit in CI.

{{flow:release}}

{{svg:ci}}

**What you get.** A pass or fail with reasons, a sealed report attached to the build, and a repeatable record for the next review.

## Choosing where to start

| If your problem is | Start with | Then |
|---|---|---|
| vague tickets | Scenario 1 | answer questions, then approve |
| requirements that keep changing | Scenario 2 | `intentsutra impact` after each revision |
| dashboards that say "done" too early | Scenario 3 | read the audit's AUD-11 |
| compliance or audit pressure | Scenarios 4 and 5 | keep the folder in Git, verify reports |
| AI-assisted workflows | Scenario 6 | install an IDE pack, keep `--confirm-human` manual |
| release gates | Scenario 7 | add `audit --strict` to CI |
