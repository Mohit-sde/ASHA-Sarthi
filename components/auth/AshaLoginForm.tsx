"use client";

import { useState, type FormEvent } from "react";
import {
  getAuthErrorMessage,
  registerAshaWorker,
  signInWithAshaId,
} from "../../lib/firebase/auth/service";
import { isValidAshaId } from "../../lib/firebase/auth/ashaID";

type Mode = "signin" | "register";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Accepts a 10-digit Indian mobile, optionally with +91 or a leading 0. Returns the 10 digits or null. */
function parseMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const inputClass = "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2";
const labelClass = "block text-sm font-medium text-gray-700";

export default function AshaLoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [ashaId, setAshaId] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
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

    if (mode === "register") {
      if (displayName.trim() === "") {
        setError("Enter your name.");
        return;
      }
      const mobileDigits = parseMobile(mobile);
      if (!mobileDigits) {
        setError("Enter a valid 10-digit mobile number.");
        return;
      }
      if (email.trim() !== "" && !EMAIL_RE.test(email.trim())) {
        setError("Enter a valid email address or leave it blank.");
        return;
      }

      setBusy(true);
      try {
        await registerAshaWorker({
          ashaId,
          password,
          displayName: displayName.trim(),
          mobile: mobileDigits,
          email: email.trim() || null,
          address: address.trim() || null,
        });
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setBusy(false);
      }
      return;
    }

    setBusy(true);
    try {
      await signInWithAshaId(ashaId, password);
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
        <label htmlFor="ashaId" className={labelClass}>
          ASHA ID
        </label>
        <input
          id="ashaId"
          value={ashaId}
          onChange={(e) => setAshaId(e.target.value)}
          autoComplete="username"
          className={inputClass}
          placeholder="e.g. PB12345"
        />
      </div>

      {mode === "register" && (
        <>
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="mobile" className={labelClass}>
              Mobile number
            </label>
            <input
              id="mobile"
              type="tel"
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel-national"
              className={inputClass}
              placeholder="e.g. 98765 43210"
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Address <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              autoComplete="street-address"
              className={inputClass}
            />
          </div>
        </>
      )}

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className={inputClass}
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