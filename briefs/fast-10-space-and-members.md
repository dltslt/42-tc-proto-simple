# fast-10: a space, its members, and how they meet on a task

**Kind:** fast
**Seed:** 100 items
**Question:** what happens, step by step, when a person signs up, creates an organisation space, brings someone in, and they work on the same task?

## Scenario

Ana signs up and has a personal space at once. She creates an organisation space, becomes its administrator, and adds Ben. She creates a task and makes Ben a contributor. Ben switches to the organisation space and finds the task waiting. He sets a blocker on it with a severity. Ana sees the blocker in her activity without a message being sent.

Ana, Ben, and their organisation space are created by the flow itself, on top of the seed. The seed's spaces are there so the same flows can be tried in a busy space.

## Build

- **Sign-up stub:** a name creates a person and their personal space. No password. A user switcher in the header acts as that person.
- **Spaces:** create an organisation space (the creator becomes its administrator), list my spaces, switch between them. The current space is always visible.
- **Members:** the administrator adds a member by name. A member list per space with roles (administrator, member).
- **Policies:** two policies in one module, chosen per space by the administrator:
  - `open`: every member sees and edits everything in the space.
  - `contributors-only`: a member sees an item only if they are a contributor on it or on one of its ancestors. The administrator sees all.
  Every server route checks the policy through `can(actor, action, resource)`. The interface never decides visibility on its own.
- **Assignment:** add a contributor to an item, and mark one as the lead.
- **Passive communication:** setting a blocker or a column writes an event, and the other members' activity shows it.
- **My work across spaces:** one page lists my items from every space I belong to, labelled by space.

## Done when

- The scenario above runs from end to end, switching the user in the header.
- Under `contributors-only`, Ben sees fewer items than Ana. A server route called directly (with curl or the browser) returns the same reduced set.
- Ana's personal space items never show in the organisation space.
- NOTES.md lists the steps each person took and counts them.

## Out of scope

Real authentication and SSO. Billing. Cross-space blockers (OPEN; note where it would break).

## Touches

What policies allow (OPEN). Whether a task sits in exactly one space (OPEN). Space as the identity of an organisational context (PROPOSED).
