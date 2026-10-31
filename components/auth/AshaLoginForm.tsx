"use client";

import { useState, type FormEvent } from "react";
import {
  getAuthErrorMessage,
  registerAshaWorker,
  signInWithAshaId,
} from "../../lib/firebase/auth/service";
import { isValidAshaId } from "../../lib/firebase/auth/ashaID";

type Mode = "signin" | "register";

export default function AshaLoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [ashaId, setAshaId] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isValidAshaId(ashaId)) {
      setError("ASHA ID must be 4 to 20 letters or digits.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (mode === "register" && displayName.trim() === "") {
      setError("Enter your name.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "register") {
        await registerAshaWorker({ ashaId, password, displayName: displayName.trim() });
      } else {
        await signInWithAshaId(ashaId, password);
      }
      // Redirect happens in the login page once AuthContext sees the user.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="ashaId" className="block text-sm font-medium text-gray-700">
          ASHA ID
        </label>
        <input
          id="ashaId"
          value={ashaId}
          onChange={(e) => setAshaId(e.target.value)}
          autoComplete="username"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="e.g. PB12345"
        />
      </div>

      {mode === "register" && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "register" : "signin");
          setError(null);
        }}
        className="w-full text-sm text-emerald-700 hover:underline"
      >
        {mode === "signin" ? "First time? Create an account" : "Already registered? Sign in"}
      </button>
    </form>
  );
}