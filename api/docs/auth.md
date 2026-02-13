## Authentication & Authorization

1. **Authentication** — Auth0 plugin validates the JWT bearer token on every protected route. The `authGuard` pre-handler enforces token presence via `server.requireAuth()`.

2. **Token extraction** — The JWT is decoded to extract the user's `authId`, `email`, `name`, `picture`, and `permissions` array.

3. **Authorization** — The `fastifyRequirePermission` pre-handler checks if the token's permissions include the required values. Supports two modes:

   - `all` — user must have every listed permission
   - `any` — user must have at least one listed permission

   Returns **403 Forbidden** if the check fails.

4. **Permission types** (defined in `common/permissions`):
   - `EventPermissions` — Read, Create, Update, Delete
   - `SubscriptionPermissions` — Read, Create
   - `TeamInstancePermissions` — Read, Update
   - `TeamMembershipPermissions` — Create, Delete
   - `TeamTemplatePermissions` — Read, Create, Update, Delete
