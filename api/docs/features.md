## Feature Modules

### User

Handles user synchronization with Auth0 and profile management. When a user logs in, their Auth0 profile is synced to the local database. Users can update personal info and skills.

### Event

Manages the event lifecycle from the subscriber's perspective. Handles event subscriptions (linking users to team preferences and availability), listing teams per event, listing subscriptions with filtering/pagination, and retrieving the current active event.

### Team

Manages team instances and memberships. Supports listing teams, viewing team details, adding/removing members, and assigning coordinators to teams.

### Subscription

Provides read access to subscriptions. Supports listing all subscriptions and retrieving individual subscription details.

### Control Panel

Admin-facing operations for managing the system. Handles full CRUD for team templates and events, including soft-deleting events, setting the current active event, and auto-creating team instances when a new event is created.
