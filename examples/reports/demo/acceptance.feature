# IntentSutra AI — CANDIDATE / UNAPPROVED acceptance scenarios
Feature: Draft requirements (stakeholder approval required)

  # REQ-TEAM-001 revision 1 · Invite team member by email
  # AC-01 — stakeholder-supplied-unapproved
  Scenario: Invitation is pending and associated with the workspace
    Given [PRECONDITION TO CONFIRM]
    When [TRIGGER TO CONFIRM]
    Then Invitation is pending and associated with the workspace

  # REQ-TEAM-002 revision 1 · Assign role to invited member
  # AC-01 — stakeholder-supplied-unapproved
  Scenario: Assigned role is visible before sending
    Given [PRECONDITION TO CONFIRM]
    When [TRIGGER TO CONFIRM]
    Then Assigned role is visible before sending

  # REQ-TEAM-003 revision 1 · Accept invitation
  # AC-01 — stakeholder-supplied-unapproved
  Scenario: Valid invitation is accepted only once
    Given [PRECONDITION TO CONFIRM]
    When [TRIGGER TO CONFIRM]
    Then Valid invitation is accepted only once

  # REQ-TEAM-004 revision 1 · Revoke pending invitation
  # AC-01 — stakeholder-supplied-unapproved
  Scenario: Revoked invitation cannot be accepted
    Given [PRECONDITION TO CONFIRM]
    When [TRIGGER TO CONFIRM]
    Then Revoked invitation cannot be accepted

  # REQ-TEAM-005 revision 1 · Handle invitation errors
  # AC-01 — stakeholder-supplied-unapproved
  Scenario: Invalid invitation shows safe recovery guidance
    Given [PRECONDITION TO CONFIRM]
    When [TRIGGER TO CONFIRM]
    Then Invalid invitation shows safe recovery guidance

  # REQ-B6F280E981 revision 1 · Add team invitations with roles
  # AC-01 — candidate
  Scenario: Primary outcome
    Given [ACTOR TO CONFIRM] has the required access
    When [TRIGGER TO CONFIRM]
    Then Allow team invitations and different roles.
  # AC-02 — candidate
  Scenario: Unauthorized actor
    Given [UNAUTHORIZED ACTOR TO CONFIRM]
    When [ACTION TO CONFIRM]
    Then [ACCESS CONTROL EXPECTATION TO CONFIRM]
  # AC-03 — candidate
  Scenario: Invalid input
    Given [INVALID INPUT TO CONFIRM]
    When [ACTION TO CONFIRM]
    Then [ERROR MESSAGE AND RECOVERY TO CONFIRM]
  # AC-04 — candidate
  Scenario: Repeated action
    Given [DUPLICATE OR RETRY TO CONFIRM]
    When [ACTION REPEATS]
    Then [IDEMPOTENT OR DUPLICATE BEHAVIOR TO CONFIRM]
  # AC-05 — candidate
  Scenario: Audit and observability
    Given [ACTOR AND EVENT TO CONFIRM]
    When [STATE CHANGES]
    Then [TRACEABLE OUTCOME WITHOUT PERSONAL DATA TO CONFIRM]
