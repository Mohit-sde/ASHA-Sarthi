import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase/config";
import { ashaIdToEmail, normalizeAshaId } from "./ashaID";
import type { WorkerDetails, WorkerProfile } from "../../../types/auth";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const DEFAULT_NAME = "ASHA worker";

type Provider = WorkerProfile["provider"];

interface NewProfileInput extends WorkerDetails {
  displayName: string | null;
  ashaId: string | null;
  provider: Provider;
}

/* ---------- helpers ---------- */

const clean = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null; // never write undefined: Firestore rejects it
};

const normalizeMobile = (v: string | null | undefined): string | null => {
  const digits = v?.replace(/\D/g, "");
  return digits ? digits : null;
};

/** Builds a brand-new users/{uid} document. Every field is always present. */
function buildNewProfile(user: User, input: NewProfileInput) {
  return {
    uid: user.uid,
    displayName: clean(input.displayName) ?? user.displayName ?? DEFAULT_NAME,
    ashaId: input.ashaId,
    email: clean(input.email),
    mobile: normalizeMobile(input.mobile),
    address: clean(input.address),
    role: "asha" as const,
    provider: input.provider,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  };
}

/** One read, then either create the profile or just bump lastLoginAt. */
async function ensureProfile(user: User, input: NewProfileInput): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, buildNewProfile(user, input));
    return;
  }
  await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
}

/* ---------- auth flows ---------- */

export async function signInWithGoogle(details: Partial<WorkerDetails> = {}) {
  const { user } = await signInWithPopup(auth, googleProvider);
  await ensureProfile(user, {
    displayName: user.displayName,
    ashaId: null,
    provider: "google",
    email: user.email,
    mobile: details.mobile ?? null,
    address: details.address ?? null,
  });
}

export async function signInWithAshaId(ashaId: string, password: string) {
  const { user } = await signInWithEmailAndPassword(
    auth,
    ashaIdToEmail(ashaId),
    password,
  );
  await ensureProfile(user, {
    displayName: null,
    ashaId: normalizeAshaId(ashaId),
    provider: "password",
    email: null,
    mobile: null,
    address: null,
  });
}

export async function registerAshaWorker(
  params: { ashaId: string; password: string; displayName: string } & Partial<WorkerDetails>,
) {
  const ashaId = normalizeAshaId(params.ashaId);
  const { user } = await createUserWithEmailAndPassword(
    auth,
    ashaIdToEmail(ashaId),
    params.password,
  );
  await updateProfile(user, { displayName: params.displayName });

  await ensureProfile(user, {
    displayName: params.displayName,
    ashaId,
    provider: "password",
    email: params.email ?? null,
    mobile: params.mobile ?? null,
    address: params.address ?? null,
  });
}

/** Lets Google users (or anyone) complete missing details later. */
export async function updateWorkerDetails(uid: string, details: Partial<WorkerDetails>) {
  const update: Partial<WorkerDetails> = {};
  if ("email" in details) update.email = clean(details.email);
  if ("mobile" in details) update.mobile = normalizeMobile(details.mobile);
  if ("address" in details) update.address = clean(details.address);

  await setDoc(doc(db, "users", uid), update, { merge: true });
}

export async function getWorkerProfile(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as WorkerProfile) : null;
}

export function signOutUser() {
  return signOut(auth);
}

/* ---------- errors ---------- */

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "ASHA ID or password is incorrect.",
  "auth/user-not-found": "ASHA ID or password is incorrect.",
  "auth/wrong-password": "ASHA ID or password is incorrect.",
  "auth/email-already-in-use": "This ASHA ID is already registered.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/network-request-failed": "No network. Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Wait a few minutes and try again.",
  "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  "auth/cancelled-popup-request": "Google sign-in was cancelled.",
  "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
};

export function getAuthErrorMessage(err: unknown): string {
  if (!(err instanceof FirebaseError)) return "Something went wrong. Please try again.";
  return AUTH_MESSAGES[err.code] ?? "Something went wrong. Please try again.";
}