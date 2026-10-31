"use client";

import { useState } from "react";

// ---------------------------------------------------------------------------
// Types & nav config
// ---------------------------------------------------------------------------

export type NavIconName =
  | "analytics"
  | "progress"
  | "alerts"
  | "schedule"
  | "history"
  | "patients"
  | "profile"
  | "logout"
  | "chevron-left"
  | "chevron-right";

export interface SideNavItem {
  id: string;
  label: string;
  icon: NavIconName;
  href: string;
  badge?: number;
}

export const SIDE_NAV_ITEMS: SideNavItem[] = [
  { id: "analytics", label: "Analytics", icon: "analytics", href: "/dashboard" },
  { id: "progress", label: "Progress", icon: "progress", href: "/progress" },
  { id: "alerts", label: "Alerts", icon: "alerts", href: "/alerts", badge: 3 },
  { id: "schedule", label: "Schedule", icon: "schedule", href: "/schedule" },
  { id: "visit-history", label: "Visit history", icon: "history", href: "/visit-history" },
  { id: "patients", label: "Patients", icon: "patients", href: "/patients" },
  { id: "profile", label: "Profile", icon: "profile", href: "/profile" },
];

// ---------------------------------------------------------------------------
// Icons (inline SVG, outline style)
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<NavIconName, string[]> = {
  analytics: ["M3 3v18h18", "M7 16v-5", "M12 16V7", "M17 16v-3"],
  progress: ["M12 3a9 9 0 1 0 9 9", "M12 7a5 5 0 1 0 5 5", "M12 11h.01"],
  alerts: [
    "M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5",
    "M9 17a3 3 0 006 0",
  ],
  schedule: [
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  ],
  history: ["M12 21a9 9 0 100-18 9 9 0 000 18z", "M12 7v5l3 2"],
  patients: [
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2",
    "M9 11a4 4 0 100-8 4 4 0 000 8z",
    "M22 21v-2a4 4 0 00-3-3.87",
    "M16 3.13a4 4 0 010 7.75",
  ],
  profile: ["M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2", "M12 11a4 4 0 100-8 4 4 0 000 8z"],
  logout: ["M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4", "M16 17l5-5-5-5", "M21 12H9"],
  "chevron-left": ["M15 18l-6-6 6-6"],
  "chevron-right": ["M9 18l6-6-6-6"],
};

function Icon({ name, className = "h-5 w-5" }: { name: NavIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Side nav
// ---------------------------------------------------------------------------

interface SideNavProps {
  projectName?: string;
  userName: string;
  activeId: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  items?: SideNavItem[];
  defaultCollapsed?: boolean;
  className?: string;
}

export default function SideNav({
  projectName = "ASHA Care",
  userName,
  activeId,
  onSelect,
  onLogout,
  items = SIDE_NAV_ITEMS,
  defaultCollapsed = false,
  className = "",
}: SideNavProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const firstName = userName.trim().split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();
  const projectInitial = projectName.trim().charAt(0).toUpperCase();

  return (
    // Hidden on mobile, where the dashboard's bottom nav takes over.
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-300 md:flex ${
        collapsed ? "w-20" : "w-64"
      } ${className}`}
    >
      {/* Header: project name + expand/collapse */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
            {projectInitial}
          </div>
          {!collapsed && (
            <span className="truncate text-base font-semibold text-gray-900">{projectName}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon name={item.icon} />
                  {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                  {!collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-rose-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: logout + user avatar */}
      <div className="space-y-3 border-t border-gray-200 p-3">
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-rose-50 hover:text-rose-700 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon name="logout" />
          {!collapsed && <span>Logout</span>}
        </button>

        <div
          className={`flex items-center gap-3 rounded-xl bg-gray-50 p-2 ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? userName : undefined}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initial}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">{firstName}</p>
              <p className="truncate text-xs text-gray-500">{userName}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}