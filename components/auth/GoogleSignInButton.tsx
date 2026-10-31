"use client";

import { useState } from "react";
import { signInWithGoogle, getAuthErrorMessage } from "../../lib/firebase/auth/service";

export default function GoogleSignInButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? "Signing in..." : "Continue with Google"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}