"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/authContext"; // placeholder: use your auth hook
import AppShell from "../../../components/layout/AppShell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  const name = profile?.displayName ?? user.displayName ?? "ASHA worker";

  return <AppShell userName={name}>{children}</AppShell>;
}