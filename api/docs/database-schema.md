## Database Schema

### Tables

**users**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| auth_id | text | Unique, Auth0 identifier |
| email | text | Unique |
| name, nickname, phone | text | Profile info |
| picture_url | text | Avatar |
| date_of_birth | timestamp | |
| emergency_contact_name | text | |
| emergency_contact_phone | text | |
| has_acting_skills, has_communication_skills, has_cooking_skills, has_dancing_skills, has_manual_skills, has_music_skills, has_singing_skills | boolean | Skill flags |
| experience_type | enum | `newbie`, `experienced`, `coordinator` |
| created_at, updated_at | timestamp | |

**events**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | |
| description | text | |
| is_current | boolean | Marks the active event |
| deleted_at | timestamp | Soft delete |
| created_at, updated_at | timestamp | |

**team_templates**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| name | text | |
| key | text | Unique identifier |
| description | text | Nullable |
| created_at, updated_at | timestamp | |

**team_instances**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| template_id | uuid | FK → team_templates |
| event_id | uuid | FK → events |
| first_coordinator_id | uuid | FK → users, nullable |
| second_coordinator_id | uuid | FK → users, nullable |
| created_at, updated_at | timestamp | |

**team_memberships**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| team_instance_id | uuid | FK → team_instances |
| created_at, updated_at | timestamp | |

**subscriptions**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users |
| event_id | uuid | FK → events |
| status | enum | `pending`, `received`, `completed`, `waiting_list` |
| availability | enum[] | Days of the week |
| created_at, updated_at | timestamp | |

**subscription_options**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| subscription_id | uuid | FK → subscriptions |
| team_instance_id | uuid | FK → team_instances |
| created_at, updated_at | timestamp | |

### Relationships

```
users ─┬─< subscriptions >── events
       │        │
       │        └──< subscription_options >── team_instances
       │
       ├─< team_memberships >── team_instances
       │
       └── team_instances (as first/second coordinator)

team_templates ─< team_instances >── events
```
