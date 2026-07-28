import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, matchesPermission, getRolePermissions } from "@/lib/permissions";

interface ProtectedRouteProps {
  permission?: string;
  anyPermissions?: string[];
  role?: string | string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  permission,
  anyPermissions,
  role,
  redirectTo = "/auth/sign-in",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/auth/sign-in" replace />;
    }
  }

  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  if (anyPermissions && anyPermissions.length > 0) {
    const rolePerms = getRolePermissions(user.role);
    const hasAny = anyPermissions.some((p) => matchesPermission(p, rolePerms));
    if (!hasAny) {
      return <Navigate to="/auth/sign-in" replace />;
    }
  }

  return <Outlet />;
}
