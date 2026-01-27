import { hasAnyPermission } from "./hasAnyPermission";

describe("hasAnyPermission", () => {
  it("should return true if user has at least one of the required permissions", () => {
    const userPermissions = ["read", "write", "delete"];
    const requiredPermissions = ["execute", "write"];

    const result = hasAnyPermission(userPermissions, requiredPermissions);
    expect(result).toBe(true);
  });

  it("should return false if user does not have any of the required permissions", () => {
    const userPermissions = ["read", "write"];
    const requiredPermissions = ["execute", "delete"];

    const result = hasAnyPermission(userPermissions, requiredPermissions);
    expect(result).toBe(false);
  });
});
