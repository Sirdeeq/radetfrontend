import { useMemo } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission as checkPermission, matchesPermission, getRolePermissions } from "@/lib/permissions";

export interface SidebarItem {
  key: string;
  label: string;
  icon?: string;
  path: string;
  permission: string;
  children?: SidebarItem[];
  badge?: string;
}

const SIDEBAR_TREE: SidebarItem[] = [
  { key: "dashboard", label: "Dashboard", icon: "NiHome", path: "/dashboards/default", permission: "dashboard:read" },
  { key: "clients", label: "Clients", icon: "NiUsers", path: "/clients", permission: "clients:read" },
  {
    key: "reports",
    label: "Reports",
    icon: "NiDocumentFull",
    path: "/reports",
    permission: "reports:read",
    children: [
      { key: "upload", label: "Upload", icon: "NiArrowInUp", path: "/reports/upload", permission: "reports:upload" },
      { key: "art-refill", label: "ART Refill", path: "/reports/art-refill", permission: "reports:read:art_refill" },
      { key: "next-refill", label: "Next Refill", path: "/reports/next-refill", permission: "reports:read:next_refill" },
      { key: "iit", label: "IIT Tracking", path: "/reports/iit", permission: "reports:read:iit" },
      { key: "viral-load", label: "Viral Load", path: "/reports/viral-load", permission: "reports:read:viral_load" },
      { key: "eac", label: "EAC", path: "/reports/eac", permission: "reports:read:eac" },
      { key: "tpt", label: "TPT", path: "/reports/tpt", permission: "reports:read:tpt" },
      { key: "tb", label: "TB Screening", path: "/reports/tb", permission: "reports:read:tb_screening" },
      { key: "biometrics", label: "Biometrics", path: "/reports/biometrics", permission: "reports:read:biometric" },
      { key: "cervical-cancer", label: "Cervical Cancer", path: "/reports/cervical-cancer", permission: "reports:read:cervical_cancer" },
      { key: "dsd", label: "DSD", path: "/reports/dsd", permission: "reports:read:dsd" },
      { key: "data-quality", label: "Data Quality", path: "/reports/data-quality", permission: "reports:read:data_quality" },
      { key: "other", label: "Other", path: "/reports/other", permission: "reports:read:other" },
    ],
  },
  { key: "worklists", label: "Worklists", icon: "NiList", path: "/worklists", permission: "worklists:read", badge: "worklistCount" },
  { key: "flags", label: "Flags", icon: "NiExclamationSquare", path: "/flags", permission: "flags:read", badge: "flagsCount" },
  { key: "followups", label: "Follow-ups", icon: "NiMessages", path: "/followups", permission: "followups:read" },
  { key: "kpis", label: "KPIs", icon: "NiChartPie", path: "/kpis", permission: "kpis:read" },
  { key: "users", label: "Users", icon: "NiUser", path: "/users", permission: "users:read" },
  { key: "facilities", label: "Facilities", icon: "NiBuilding", path: "/facilities", permission: "facilities:read" },
  { key: "organizations", label: "Organizations", icon: "NiFolder", path: "/organizations", permission: "organizations:read" },
  { key: "audit-logs", label: "Audit Logs", icon: "NiDocumentCode", path: "/audit-logs", permission: "audit:read" },
  { key: "settings", label: "Settings", icon: "NiSettings", path: "/settings", permission: "settings" },
];

const filterSidebarItems = (items: SidebarItem[], permissions: string[]): SidebarItem[] => {
  if (permissions.includes("*")) return items;

  return items
    .filter((item) => {
      return permissions.some((_p) => matchesPermission(item.permission, permissions));
    })
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterSidebarItems(item.children, permissions);
        return { ...item, children: filteredChildren.length > 0 ? filteredChildren : undefined };
      }
      return item;
    });
};

export function useSidebar() {
  const { user } = useAuth();

  const sidebarItems = useMemo(() => {
    if (!user) return [];
    const rolePerms = getRolePermissions(user.role);
    return filterSidebarItems(SIDEBAR_TREE, rolePerms);
  }, [user]);

  const canAccess = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user, permission);
  };

  return { sidebarItems, canAccess };
}
