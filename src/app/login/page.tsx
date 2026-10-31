"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/authContext";
import GoogleSignInButton from "../../../components/auth/GoogleSignInButton";
import AshaLoginForm from "../../../components/auth/AshaLoginForm";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return <p className="p-6 text-center text-gray-500">Loading...</p>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">ASHA-Sarthi</h1>
          <p className="text-sm text-gray-500">Sign in to continue</p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="h-px flex-1 bg-gray-200" /> OR <span className="h-px flex-1 bg-gray-200" />
        </div>

        <AshaLoginForm />
      </div>
    </main>
  );
}