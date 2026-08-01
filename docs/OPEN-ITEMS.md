# Open Items

## Remaining Engineering Work

- Provision the actual hosted PostgreSQL instance and run the included production migration during deployment.
- Expand automated browser coverage from smoke tests into full auth, article publish, homepage publish/schedule, classifieds moderation, and audience-flow coverage.
- Add article preview URLs, scheduled article publish/unpublish, and correction-note workflow.
- Replace the remaining raw homepage settings JSON surface with first-class editor controls.
- Add deeper monitoring, alerting, and operational error reporting.
- Add outbound notifications for subscriptions, contact routing, classifieds enquiries, and editorial workflow events.

## Remaining Product Decisions

- Should guest writer self-registration ever be enabled in production? It is currently gated behind `ALLOW_GUEST_REGISTRATION`.
- What are the final role definitions and permissions?
- Should approved stories publish immediately for editors, or always require a second approval step?
- Should premium memberships and paywalled routes ship in the next phase, or stay deferred behind free registration only?
- What seller-verification and paid-package rules should classifieds enforce?
- How much of the homepage settings JSON should become first-class form fields?

## Remaining Delivery Tasks

- Initialize a git repository if the handoff should be versioned.
- Decide whether the seeded demo database should ship with the handoff.
- Add production environment values and secret management.
- Confirm hosting target and deployment workflow.
