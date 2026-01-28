import { Permission } from "../permissions.types";

/**
 * Helper function to check if user has permission
 * @param userPermissions - list of all users permissions
 * @param requiredPermission - the permission to be checked
 * @returns boolean that represents if user has the required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string | Permission,
): boolean {
  return userPermissions.includes(requiredPermission);
}
