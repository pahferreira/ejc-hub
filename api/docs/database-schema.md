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
| subscriptions_open | boolean | Gates the subscription form, default `true` |
| fee_amount_cents | integer | Subscription fee in cents, default `0` (= no fee tracked) |
| fee_currency | text | Default `BRL` |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamp | |

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

**team_assignment_audit**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| subscription_id | uuid | FK → subscriptions |
| team_instance_id | uuid | FK → team_instances, nullable |
| action | enum | `assign`, `unassign`, `move`, `cancel` |
| actor_id | uuid | FK → users |
| at | timestamp | Default now |

> Currently unused — the table exists but nothing under `api/src` reads or writes it.

### Relationships

```
circles ─< users

users ─┬─< subscriptions >── events
       │        │
       │        ├──< subscription_options >── team_instances
       │        │
       │        └──< team_assignment_audit >── team_instances
       │
       ├─< team_memberships >── team_instances
       │
       └─< event_fee_payments >── events

team_templates ─< team_instances >── events
```
