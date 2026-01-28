export const EventPermissions = {
  Create: "events:create",
  Read: "events:read",
  Update: "events:update",
  Delete: "events:delete",
} as const;

export const SubscriptionPermissions = {
  Create: "subscriptions:createa",
  Read: "subscriptions:read",
  Update: "subscriptions:update",
  Delete: "subscriptions:delete",
} as const;

export const TeamInstancePermissions = {
  Create: "team-instances:create",
  Read: "team-instances:read",
  Update: "team-instances:update",
  Delete: "team-instances:delete",
} as const;

export const TeamMembershipPermissions = {
  Create: "team-memberships:create",
  Read: "team-memberships:read",
  Update: "team-memberships:update",
  Delete: "team-memberships:delete",
} as const;

export const TeamTemplatePermissions = {
  Create: "team-templates:create",
  Read: "team-templates:read",
  Update: "team-templates:update",
  Delete: "team-templates:delete",
} as const;

// Union type for all permissions
export type Permission =
  | (typeof EventPermissions)[keyof typeof EventPermissions]
  | (typeof SubscriptionPermissions)[keyof typeof SubscriptionPermissions]
  | (typeof TeamInstancePermissions)[keyof typeof TeamInstancePermissions]
  | (typeof TeamMembershipPermissions)[keyof typeof TeamMembershipPermissions]
  | (typeof TeamTemplatePermissions)[keyof typeof TeamTemplatePermissions];
