import { hasPermission } from "./hasPermission";

describe("hasPermission", () => {
  it("should return true if user has the required permission", () => {
    const userPermissions = ["read", "write", "delete"];
    const requiredPermission = "write";

    const result = hasPermission(userPermissions, requiredPermission);
    expect(result).toBe(true);
  });

  it("should return false if user does not have the required permission", () => {
    const userPermissions = ["read", "write"];
    const requiredPermission = "delete";

    const result = hasPermission(userPermissions, requiredPermission);
    expect(result).toBe(false);
  });
});
