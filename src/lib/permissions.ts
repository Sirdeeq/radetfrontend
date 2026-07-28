import { AuthUser, UserRole } from "@/types/auth";

const PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "users:*",
    "organizations:*",
    "facilities:*",
    "reports:*",
    "flags:*",
    "worklists:*",
    "dashboard:*",
    "settings:*",
    "audit:read",
  ],
  ME: [
    "reports:upload",
    "reports:read",
    "reports:export",
    "flags:read",
    "flags:read:data_quality",
    "flags:assign",
    "flags:escalate",
    "worklists:read",
    "dashboard:read:facility",
    "dashboard:read:organization",
    "kpis:read",
    "users:read",
  ],
  DEC: [
    "reports:upload",
    "reports:read",
    "clients:read",
    "clients:update:demographics",
    "flags:read:data_quality",
    "dashboard:read:facility",
  ],
  CM: [
    "clients:read",
    "clients:search",
    "followups:create",
    "followups:read",
    "followups:update",
    "worklists:read:assigned",
    "flags:read:assigned",
    "flags:update:assigned",
    "dashboard:read:self",
  ],
  PN: [
    "clients:read",
    "followups:create",
    "followups:read",
    "worklists:read:assigned",
    "dashboard:read:self",
  ],
  VLC: [
    "reports:read:viral_load",
    "worklists:read:vl",
    "flags:read:vl",
    "dashboard:read:vl",
  ],
  SUPERVISOR: [
    "reports:read",
    "flags:read:team",
    "flags:escalate",
    "followups:read:team",
    "worklists:read:team",
    "dashboard:read:team",
    "kpis:read:team",
    "users:read:team",
  ],
  USER: ["dashboard:read:self"],
};

const ROLES_THAT_BYPASS_SCOPING: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export const getRolePermissions = (role: UserRole): string[] => {
  return PERMISSIONS[role] || [];
};

export const matchesPermission = (required: string, permissions: string[]): boolean => {
  if (permissions.includes("*")) return true;
  if (permissions.includes(required)) return true;

  const parts = required.split(":");
  for (let i = parts.length - 1; i >= 1; i--) {
    const partial = parts.slice(0, i).join(":") + ":*";
    if (permissions.includes(partial)) return true;
  }

  return false;
};

export const hasPermission = (user: AuthUser | null, permission: string): boolean => {
  if (!user) return false;
  const perms = getRolePermissions(user.role);
  return matchesPermission(permission, perms);
};

export const hasAnyPermission = (user: AuthUser | null, permissions: string[]): boolean => {
  return permissions.some((p) => hasPermission(user, p));
};

export const bypassesScoping = (user: AuthUser | null): boolean => {
  if (!user) return false;
  return ROLES_THAT_BYPASS_SCOPING.includes(user.role);
};
