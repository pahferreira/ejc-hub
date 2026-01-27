import { Permission } from "../permissions.types";

/**
 * Helper function to check if user has any of the permissions
 * @param userPermissions - list of all users permissions
 * @param requiredPermissions - the permissions to be checked
 * @returns boolean that represents if user has any of the required permissions
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[] | Permission[],
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission),
  );
}
