"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import SideNav, { SIDE_NAV_ITEMS } from "../../components/side-nav/SideNav";
import { signOutUser } from "../../lib/firebase/auth/service";

interface AppShellProps {
  userName: string;
  children: ReactNode;
}

export default function AppShell({ userName, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Active item is derived from the URL, so it survives refresh and deep links.
  const activeId =
    SIDE_NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.id ?? "";

  function handleSelect(id: string) {
    const item = SIDE_NAV_ITEMS.find((i) => i.id === id);
    if (item) router.push(item.href);
  }

  async function handleLogout() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNav
        projectName="ASHA Care"
        userName={userName}
        activeId={activeId}
        onSelect={handleSelect}
        onLogout={handleLogout}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}