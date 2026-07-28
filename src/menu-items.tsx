import { MenuItem } from "@/types/types";

export const leftMenuItems: MenuItem[] = [
  {
    id: "dashboards",
    icon: "NiHome",
    label: "Dashboard",
    href: "/dashboards/default",
  },
  {
    id: "clients",
    icon: "NiGroup",
    label: "Clients",
    href: "/clients",
  },
  {
    id: "reports",
    icon: "NiDocumentFull",
    label: "Reports",
    href: "/reports",
    children: [
      { id: "upload", icon: "NiArrowInUp", label: "Upload", href: "/reports/upload" },
      { id: "art-refill", label: "ART Refill", href: "/reports/art-refill" },
      { id: "next-refill", label: "Next Refill", href: "/reports/next-refill" },
      { id: "iit", label: "IIT Tracking", href: "/reports/iit" },
      { id: "viral-load", label: "Viral Load", href: "/reports/viral-load" },
      { id: "eac", label: "EAC", href: "/reports/eac" },
      { id: "tpt", label: "TPT", href: "/reports/tpt" },
      { id: "tb", label: "TB Screening", href: "/reports/tb" },
      { id: "biometrics", label: "Biometrics", href: "/reports/biometrics" },
      { id: "cervical-cancer", label: "Cervical Cancer", href: "/reports/cervical-cancer" },
      { id: "dsd", label: "DSD", href: "/reports/dsd" },
      { id: "data-quality", label: "Data Quality", href: "/reports/data-quality" },
      { id: "other", label: "Other", href: "/reports/other" },
    ],
  },
  {
    id: "flags",
    icon: "NiExclamationSquare",
    label: "Flags",
    href: "/flags",
  },
  {
    id: "followups",
    icon: "NiPhone",
    label: "Follow-ups",
    href: "/followups",
  },
  {
    id: "kpis",
    icon: "NiChartLine",
    label: "KPIs",
    href: "/kpis",
  },
  {
    id: "worklists",
    icon: "NiList",
    label: "Worklists",
    href: "/worklists",
  },
  {
    id: "users",
    icon: "NiUser",
    label: "Users",
    href: "/users",
  },
  {
    id: "facilities",
    icon: "NiBuilding",
    label: "Facilities",
    href: "/facilities",
  },
  {
    id: "organizations",
    icon: "NiFolder",
    label: "Organizations",
    href: "/organizations",
  },
  {
    id: "audit-logs",
    icon: "NiClock",
    label: "Audit Logs",
    href: "/audit-logs",
  },
  {
    id: "settings",
    icon: "NiSettings",
    label: "Settings",
    href: "/settings",
  },
  {
    id: "flag-rules",
    icon: "NiBraces",
    label: "Flag Rules & Formulas",
    href: "/settings/flag-rules",
  },
];

export const leftMenuBottomItems: MenuItem[] = [];
