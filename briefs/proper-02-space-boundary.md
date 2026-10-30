# proper-02: the space as a security boundary

**Kind:** proper
**Seed:** 100 items
**Question:** what does a space have to be in code so that its policies are the security boundary: resources, members, policies, and configurations?

## Team notes

From the team's notes of 30 October, quoted as written:

> A space is the identity of an organisational context. A person alone is a context. Every user has a space, and can also join an organization's space. The space is billable. It is not a project.
>
> It holds four things. Resources are the tasks and the other records that live there. Members are the people in it, including an administrator. Policies are what a person can see and do, and what they may edit. Configurations are the interface built in that space.
>
> The security boundary is not "space limits visibility." It is the setup and enforcement of those policies. "See nothing above your first note unless you are on the team" is one policy, not the definition. Ownership of the space and the policies inside it are different things.
>
> So the question "what is a space for, besides limiting visibility?" is the wrong question. What is still open is whether a dependency can cross a space, whether a task sits in exactly one, and what the policies actually allow.

## Findings from earlier runs

(Filled in by hand before this run starts. If empty, ignore.)

## Scenario

A person signs in and has a personal space. They create an organisation space, become its administrator, and add a second person. They create a task and make the second person a contributor. The second person signs in, finds the task, and sets a blocker on it. Then someone tries to read and change things they should not, through the interface and through the server routes directly.

## Build

- Sign-in with sessions (email and password is enough; name the library if one is used).
- A space owns resources, members, policies, and configurations, as the spec describes. Every user has a personal space.
- Policies as data, not as branches in route code: a space holds its policies, and one function evaluates them for an actor, an action, and a resource. At least: who can see an item, who can edit which fields, who can change the space's configuration, who can add members.
- Every server route goes through that function. A test walks every route as a non-member and as a member under each policy, and expects the right refusals.
- One cross-space case, written down rather than solved: a blocker from an item in one space to an item in another. Show what each member can see of it.
- The server routes return the same answers as the interface. Nothing is hidden only in the interface.

## Done when

- The route test passes, and it fails if a policy check is removed from any route.
- NOTES.md lists the policies built, and the questions the team has to answer before policies can be final.

## Out of scope

SSO, billing, and invitations by email.

## Touches

What policies allow (OPEN). Whether a task sits in exactly one space (OPEN). Whether a blocker can cross spaces (OPEN).
