# Cavi Projects — Product Implementation Programme

## Product objective

Cavi Projects will become the daily operating system for a property development team. It should connect portfolio oversight, project delivery, personal work, meetings, decisions, documents, consultants, programme, budget, and reporting without turning every reminder into formal programme noise.

## Product principles

1. **One source, several views.** Project tasks, personal actions, meeting actions, and programme dates share context but appear at the level appropriate to each user.
2. **Explainable intelligence.** Recommendations always explain why an item matters. AI never silently changes dates, owners, or project records.
3. **Fast by default.** Common work is completed inline. Full forms are reserved for uncommon detail.
4. **Waiting is work.** External dependencies and follow-ups are first-class operational states.
5. **Operational calm.** Notifications are bundled and prioritised. The interface should reduce anxiety, not manufacture urgency.
6. **Auditability.** Material decisions, changes, approvals, exports, and AI-assisted edits retain author and time history.

## Foundation release — identity, tenancy, and trustworthy records

### Capabilities

- Workspace and user membership with `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER` roles.
- Workspace-scoped projects, contacts, tasks, meetings, documents, and settings.
- Internal user assignment separate from external consultant contacts.
- Activity records for task status, ownership, dates, comments, and decisions.
- Notification inbox and user preferences.
- Archive rather than destructive deletion for operational records.

### Implementation

- Add `Workspace`, `User`, and `WorkspaceMember` models.
- Add optional `assignedUserId` to formal project tasks while retaining external `Contact` assignment.
- Add `ActivityEvent`, `Notification`, and `NotificationPreference` models.
- Introduce server-side current-user and workspace access helpers before exposing multi-user routes.
- Apply workspace filters to every server query and mutation.

### Acceptance criteria

- A user cannot read or mutate another workspace.
- Every task can be assigned to an internal user, external contact, free-text owner, or remain unassigned.
- Material changes record actor, entity, previous value, and new value.
- Permissions are enforced on the server, not merely hidden in the interface.

## Release 1 — My Work foundation

### Capabilities

- Unified personal command centre across all assigned project tasks and private actions.
- Views: `Today`, `Upcoming`, `Overdue`, `Waiting`, `Unscheduled`, and `Completed`.
- Intentional Today list independent from due dates.
- Personal actions that may optionally reference a project, contact, meeting, or formal task.
- Natural-language quick capture with deterministic date parsing first.
- Inline complete, reschedule, prioritise, assign, wait, comment, and open-context actions.
- Keyboard shortcuts: `/` search, `N` new action, `T` add to Today, `E` edit, `C` complete.
- Bulk reschedule and bulk Today planning.

### Data model

- `PersonalAction`: owner, title, notes, planned date, due date, estimate, priority, status, waiting details, and optional contextual references.
- Extend `TaskStatus` with `WAITING` and `CANCELLED` while preserving `BLOCKED` for an actual impediment.
- Task fields: `plannedDate`, `estimateMinutes`, `completedAt`, `waitingOn`, `waitingSince`, `followUpDate`, and `lastActivityAt`.

### Interaction design

- The first viewport answers: “What needs my attention today?”
- Three recommendation bands: `Do now`, `Plan next`, and `Monitor`.
- Every recommendation includes a reason such as “Due tomorrow · blocks 2 tasks”.
- Quick capture accepts a sentence, previews parsed fields, and saves only after confirmation.
- Personal actions are private by default and can be promoted to formal project tasks.

### Acceptance criteria

- A user can capture and organise an action in under ten seconds.
- Project updates made from My Work immediately update the project view.
- A planned-today item may have a different contractual due date.
- Waiting items require a person/organisation or explanation and support a follow-up date.

## Release 2 — smart prioritisation and daily planning

### Capabilities

- Explainable priority recommendation using due date, explicit priority, downstream blockers, project status, inactivity, estimate, and milestone proximity.
- Morning planning flow recommending three to five focus items.
- Capacity view comparing estimated effort with available daily focus time.
- End-of-day rollover with deliberate reschedule, not silent movement.
- Daily briefing and weekly look-ahead.

### Scoring approach

- Begin with transparent rules and weights stored in workspace settings.
- Persist the score factors and generated explanation, not just a number.
- Allow `Accept`, `Snooze`, and `Not relevant`; use feedback to tune workspace weights.
- Add an AI narrative layer only after deterministic scoring is trusted.

### Acceptance criteria

- Two users can understand why the same item is ranked differently.
- Recommendations never overwrite explicit user priority or dates.
- Workload warnings account for estimated effort and calendar availability.

## Release 3 — waiting, dependencies, and programme intelligence

### Capabilities

- Finish-to-start, start-to-start, finish-to-finish, and soft relationship types.
- Impact preview before moving dependent dates.
- Waiting register across consultants, councils, contractors, and clients.
- Automatic follow-up reminders and escalation rules.
- Milestones and critical-path indicators.

### Data model

- `TaskDependency`: predecessor, successor, type, lag days, and enforcement mode.
- `Milestone`: project, phase, owner, baseline date, forecast date, actual date, and status.
- Waiting fields remain on work items for simple operation; recurring interactions produce `FollowUp` records.

### Acceptance criteria

- The system detects circular dependencies.
- A schedule change shows affected tasks before applying downstream movement.
- Overdue follow-ups are visible in My Work and the project risk view.

## Release 4 — meetings, decisions, and action capture

### Capabilities

- Meeting templates, recurring series, agenda collaboration, minutes, and distribution.
- Convert agenda actions to formal tasks or personal actions with owner and due date confirmation.
- Decision log with context, options, decision-maker, date, and affected records.
- Previous-meeting unresolved actions automatically appear during preparation.
- Draft follow-up communication and minutes summary.

### Acceptance criteria

- Meeting actions are not created until a user confirms owner, record type, and timing.
- Each generated action links back to the source agenda line.
- Published minutes are versioned and immutable; amendments create a revision.

## Release 5 — calendar and email

### Capabilities

- Microsoft 365 and Google Calendar connection using delegated OAuth.
- Time-block tasks without changing contractual due dates.
- Calendar-aware capacity and meeting preparation reminders.
- Convert email to work item while retaining a secure source link.
- Draft, but never automatically send, follow-up messages.

### Acceptance criteria

- Revoking an integration removes tokens without deleting captured work.
- Only minimum OAuth scopes are requested.
- External content is treated as untrusted and cannot trigger automatic actions.

## Release 6 — portfolio risk and reporting

### Capabilities

- Structured project risk register with likelihood, impact, mitigation, owner, and review date.
- Portfolio risk heatmap and change-over-time reporting.
- Automated weekly reports combining programme, actions, meetings, decisions, and risks.
- Executive and delivery-team report variants.
- Snapshot reports remain reproducible after underlying data changes.

### Acceptance criteria

- Every reported metric links to its source records.
- Users review and approve narrative reports before distribution.
- Reports record generation time, included data window, author, and revision.

## Release 7 — documents and approvals

### Capabilities

- Document register, versions, metadata, disciplines, packages, and transmittals.
- Approval workflows with reviewers, due dates, outcomes, and conditions.
- Link documents to tasks, meetings, decisions, risks, and milestones.
- Full-text and metadata search.

### Acceptance criteria

- Version history is immutable and downloadable.
- Approval authority is permission-controlled and auditable.
- Superseded documents are unmistakable and excluded from default current views.

## Release 8 — budget and commercial controls

### Capabilities

- Project budgets, cost codes, commitments, invoices, forecasts, variations, and contingencies.
- Actual versus committed versus forecast views.
- Approval thresholds and commercial audit history.
- Programme-to-cashflow forecasting.

### Acceptance criteria

- Currency arithmetic uses decimal-safe storage.
- Financial permissions are separate from general project permissions.
- Forecast changes retain previous values and rationale.

## Release 9 — external portal and mobile capture

### Capabilities

- Restricted consultant, contractor, and client access.
- Explicitly shared tasks, documents, RFIs, approvals, and progress summaries.
- Mobile-first notes, photos, voice capture, and offline draft queue.
- Share links with expiry and revocation.

### Acceptance criteria

- External users can access only explicitly shared records.
- Mobile drafts reconcile safely after reconnecting.
- Uploads are scanned, size-limited, and permission-checked before access.

## Release 10 — search and connected intelligence

### Capabilities

- Permission-aware search across projects, people, tasks, meetings, decisions, risks, and documents.
- “What changed?” summaries grounded in activity records.
- Duplicate detection and missing-data suggestions.
- Project and phase suggestion during capture.
- Conversational questions with citations to application records.

### AI safety and quality gates

- AI output is always labelled as draft or suggestion.
- Answers cite source records and respect existing access controls.
- Prompts and outputs exclude secrets and unnecessary personal information.
- High-impact changes require preview and explicit confirmation.
- Evaluation sets cover date extraction, assignment, summarisation, false claims, and cross-workspace leakage.

## Delivery sequencing

| Milestone | Scope | Indicative outcome |
| --- | --- | --- |
| M0 | Foundation | Secure multi-user ownership and auditability |
| M1 | My Work | Daily personal command centre |
| M2 | Smart planning | Explainable focus and capacity planning |
| M3 | Dependencies | Trustworthy schedule and follow-up intelligence |
| M4 | Meetings | Closed loop from discussion to delivery |
| M5 | Integrations | Calendar and email capture |
| M6 | Risk/reporting | Portfolio-level control and communication |
| M7 | Documents | Controlled project information |
| M8 | Commercial | Budget and forecast discipline |
| M9 | Portal/mobile | Safe external collaboration and field capture |
| M10 | Intelligence | Permission-aware search and grounded assistance |

## Engineering standards for every milestone

- Schema migration with rollback notes and representative seed data.
- Server-side validation, authorisation, and workspace isolation.
- Optimistic UI only where failure can be clearly reconciled.
- Empty, loading, error, offline, and permission-denied states.
- Keyboard, touch, reduced-motion, contrast, and screen-reader checks.
- Unit coverage for business rules and integration coverage for critical mutations.
- Production build, lint, migration validation, and manual acceptance pass before merge.
