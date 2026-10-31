"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/authContext";
import WorkerDashboard from "../../../../components/dashboard/WorkerDashboard";

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="p-6 text-center text-gray-500">Loading...</p>;
  }

  return <WorkerDashboard user={user} profile={profile} />;
}