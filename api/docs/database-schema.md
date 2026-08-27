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
| team_instance_id | uuid | FK → team_instances |
| type | enum | `member`, `coordinator` — default `member` |
| created_at, updated_at | timestamp | |

*Constraints:* `UNIQUE (team_instance_id, user_id)` — one row per user per team, keeping a user's member and coordinator rows disjoint for the same team.

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
       └─< team_memberships >── team_instances

team_templates ─< team_instances >── events
```
