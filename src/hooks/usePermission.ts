import { useAuth } from "@/contexts/AuthContext";
import { hasPermission as checkPermission, matchesPermission, getRolePermissions } from "@/lib/permissions";

export function usePermission() {
  const { user } = useAuth();

  const can = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user, permission);
  };

  const canAny = (permissions: string[]): boolean => {
    if (!user) return false;
    const rolePerms = getRolePermissions(user.role);
    return permissions.some((p) => matchesPermission(p, rolePerms));
  };

  const canAll = (permissions: string[]): boolean => {
    if (!user) return false;
    return permissions.every((p) => checkPermission(user, p));
  };

  return { can, canAny, canAll };
}
