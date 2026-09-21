## Database Schema

### Tables

**circles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| key | text | Unique, stable identifier used on the wire |
| label | text | Display name |
| color | text | Palette token |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (key)`

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| auth_id | text | Auth0 identifier |
| email | text | Unique |
| name | text | |
| nickname, phone, instagram | text | Nullable profile info |
| picture_url | text | Avatar, nullable |
| date_of_birth | timestamp | Nullable |
| emergency_contact_name | text | Nullable |
| emergency_contact_phone | text | Nullable |
| has_acting_skills, has_communication_skills, has_cooking_skills, has_dancing_skills, has_manual_skills, has_music_skills, has_singing_skills, has_guitar_skills, has_percussion_skills, has_midia_skills | boolean | Skill flags, default `false` |
| has_coordinator_experience | boolean | Self-declared, default `false` |
| experience_type | enum | `newbie`, `experienced`, `experienced_outsider` — default `experienced` |
| gender | enum | `male`, `female` — nullable |
| circle_id | uuid | FK → circles, nullable |
| already_worked_here | boolean | Nullable |
| already_worked_event, already_worked_teams, groups | text | Nullable |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (email)`

**events**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | |
| description | text | |
| starts_at, ends_at | timestamp | Nullable |
| location | text | Nullable |
| is_current | boolean | Marks the active event, default `false` |
| subscription_mode | enum | `open`, `waiting_list`, `closed` — default `open` |
| fee_amount_cents | integer | Subscription fee in cents, default `0` (= no fee tracked) |
| fee_currency | text | Default `BRL` |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamp | |

`subscription_mode` governs both whether the form is offered and what status a new subscription
lands on:

| Mode | New subscriptions | Form |
|---|---|---|
| `open` | land `pending` | shown |
| `waiting_list` | land `waiting_list` | shown, with a warning that the spot is not guaranteed |
| `closed` | rejected with `subscriptions_closed` | replaced by a closed notice |

It replaced a `subscriptions_open` boolean in migrations 0046/0047. One enum rather than the
boolean plus a second `waiting_list_mode` flag, because two booleans would allow
`subscriptions_open = false` together with waiting-list mode — a state with no meaning, since
nothing is created while subscriptions are closed. Waiting-list mode *is* open; only the
resulting status differs.

The mode shapes **new** subscriptions only. Flipping an event to `waiting_list` does not move
anyone already `pending` — reassigning existing people is the team-building board's job.

There is no UI for changing it: `PATCH /control-panel/events/:eventId/subscription-mode` with
`{ "mode": … }`, gated on `events:update`.

**team_templates**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | |
| key | text | Unique identifier |
| description | text | Nullable |
| max_capacity | integer | Default `0` |
| max_allowed_coordinators | integer | Default `3` |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (key)`

**team_instances**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| template_id | uuid | FK → team_templates |
| event_id | uuid | FK → events |
| created_at, updated_at | timestamp | |

**team_memberships**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| team_instance_id | uuid | Part of the composite FK below |
| event_id | uuid | Denormalized from team_instances; part of the composite FK below |
| type | enum | `member`, `coordinator` — default `member` |
| created_at, updated_at | timestamp | |

*Constraints:*
- `UNIQUE (team_instance_id, user_id)` — one row per user per team, keeping a user's member and coordinator rows disjoint for the same team.
- `UNIQUE (event_id, user_id)` — one membership per user per event, members and coordinators alike.
- `FOREIGN KEY (team_instance_id, event_id) → team_instances (id, event_id)` — replaces the plain FK on `team_instance_id`, which it implies.

`event_id` is denormalized on purpose. A `UNIQUE` cannot span tables, so enforcing "one membership per user per event" needs the event on the row; the composite FK then makes it impossible for that column to disagree with the team instance's own event. Do not drop it as redundant.

Coordinators are a flat peer set (`type = 'coordinator'`) with no rank or ordering between them. The max-coordinators cap is enforced as an API business rule, not a constraint.

**subscriptions**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| event_id | uuid | FK → events |
| status | enum | `pending`, `received`, `completed`, `waiting_list`, `cancelled` — default `pending` |
| availability | enum[] | Days of the week, default `[]` |
| details | text | Free-text notes, default `''` |
| working_another_event | boolean | Nullable |
| previous_experience_teams | text[] | Default `[]` |
| already_worked_here | boolean | Nullable |
| already_worked_event, already_worked_teams, groups | text | Nullable |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (user_id, event_id)`

**subscription_options**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| subscription_id | uuid | FK → subscriptions |
| team_instance_id | uuid | FK → team_instances |
| created_at, updated_at | timestamp | |

The team preferences a person picked when subscribing.

**event_fee_payments**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| event_id | uuid | FK → events |
| user_id | uuid | FK → users |
| status | enum | `pending`, `not_paid`, `paid`, `exempt`, `refunded` — default `pending` |
| amount_cents | integer | Snapshot of what this person was charged, default `0` |
| method | enum | `pix`, `cash`, `credit_card`, `transfer`, `other` — nullable |
| paid_at | timestamp | Nullable |
| notes | text | Nullable |
| recorded_by | uuid | FK → users, nullable — no actor for imported rows |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (event_id, user_id)` · `INDEX (event_id, status)`

The subscription fee is owed by anyone holding a team membership for the event, and is paid once per event regardless of how many teams the person passes through — hence the grain is `(event, user)`, not `(team, user)`. The team is a reporting dimension, resolved by joining `team_memberships`; storing `team_instance_id` here would go stale on a team move and break the per-team "who hasn't paid" report.

Rows are lazy: **no row means the person owes and nothing has been recorded yet.** Rows are not created when a membership is created.

Status meanings, which are easy to confuse:

| Status | Meaning |
|---|---|
| *(no row)* | Nobody has looked at this person yet |
| `pending` | A row exists but nothing is settled — including a declared PIX the treasurer hasn't verified |
| `not_paid` | A treasurer actively checked and confirmed this person has not paid |
| `paid` | Confirmed received |
| `exempt` | Comped — deliberately not `paid`, so totals stay honest |
| `refunded` | Returned |

`amount_cents` is snapshotted from `events.fee_amount_cents` at record time. The event fee rises as the event approaches, so two people paying in full at different times legitimately owe different amounts — the snapshot is what makes each payment reconcilable against the fee that applied when it was taken, and editing `events.fee_amount_cents` never rewrites history.

**member_requests**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | The person being asked for |
| team_instance_id | uuid | The asking team |
| event_id | uuid | Denormalized from `team_instances` |
| status | enum | `pending`, `approved`, `denied`, `cancelled`, `outdated` — default `pending` |
| requested_by | uuid | FK → users — the coordinator who asked |
| message | text | Nullable — why the team wants this person |
| resolved_at | timestamp | Nullable |
| resolved_by | uuid | FK → users, nullable — no actor for system-written rows |
| resolution_reason | text | Nullable, free text |
| created_at, updated_at | timestamp | |

*Constraints:* `FK (team_instance_id, event_id) → team_instances` · `FK (user_id, event_id) → subscriptions` · `UNIQUE (team_instance_id, user_id) WHERE status = 'pending'` · `INDEX (team_instance_id, status)` · `INDEX (event_id, status)`

A coordinator asks for a specific person; an admin approves or denies. The member is the resource being requested — there is no member-initiated path.

Keyed by `user_id` rather than `subscription_id` because every team-building write path is user-keyed, so an approval hands the id straight through to `insertTeamMembership`. The composite FK to `subscriptions (user_id, event_id)` still guarantees the person holds a subscription to this event, and supplies `user_id`'s reference to `users` transitively. It proves a subscription *exists*, not that it is active — a cancelled subscription keeps its row, so "is this person still coming" stays an API-level check.

`event_id` is denormalized for the same reason it is on `team_memberships`: a UNIQUE cannot span tables, and both composite FKs need it here.

The unique index is **partial** — one *open* request per (team, person). A plain unique would make a denial permanent; an event-wide one would forbid two teams asking for the same person, which is allowed and is the signal this queue exists to surface. Only the *acceptance* is exclusive, and `team_memberships (event_id, user_id)` is what enforces that.

Status meanings:

| Status | Written by | `resolved_by` | Meaning |
|---|---|---|---|
| `pending` | default | null | Open, in the admin queue |
| `approved` | admin | the admin | The membership was written in the same transaction |
| `denied` | admin | the admin | An explicit "no" to *this* request |
| `cancelled` | coordinator, or subscription cancellation | the coordinator, or null | Withdrawn — nobody answered it |
| `outdated` | system | **null** | The person took a membership elsewhere in the event, so the request became unanswerable |

A set `resolved_at` paired with a null `resolved_by` is the encoding of "the system closed this"; there is no other signal for it.

### Relationships

```
circles ─< users

users ─┬─< subscriptions >── events
       │        │
       │        ├──< subscription_options >── team_instances
       │        │
       │        └──< member_requests >── team_instances
       │
       ├─< team_memberships >── team_instances
       │
       └─< event_fee_payments >── events

team_templates ─< team_instances >── events
```
