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
import type { WorkerProfile } from "../../../types/auth";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

interface ProfileInput {
  displayName: string | null;
  ashaId: string | null;
  provider: "google" | "password";
}

/** Creates the users/{uid} profile on first login, or updates lastLoginAt. */
async function ensureProfile(user: User, input: ProfileInput) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
    return;
  }

  await setDoc(ref, {
    uid: user.uid,
    displayName: input.displayName ?? user.displayName ?? "ASHA worker",
    ashaId: input.ashaId,
    role: "asha", // new users are always ASHA workers; roles change only server-side later
    provider: input.provider,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureProfile(cred.user, {
    displayName: cred.user.displayName,
    ashaId: null,
    provider: "google",
  });
}

export async function signInWithAshaId(ashaId: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, ashaIdToEmail(ashaId), password);
  await ensureProfile(cred.user, {
    displayName: null,
    ashaId: normalizeAshaId(ashaId),
    provider: "password",
  });
}

export async function registerAshaWorker(params: {
  ashaId: string;
  password: string;
  displayName: string;
}) {
  const cred = await createUserWithEmailAndPassword(
    auth,
    ashaIdToEmail(params.ashaId),
    params.password,
  );
  await updateProfile(cred.user, { displayName: params.displayName });
  await ensureProfile(cred.user, {
    displayName: params.displayName,
    ashaId: normalizeAshaId(params.ashaId),
    provider: "password",
  });
}

export async function getWorkerProfile(uid: string): Promise<WorkerProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as WorkerProfile) : null;
}

export function signOutUser() {
  return signOut(auth);
}

export function getAuthErrorMessage(err: unknown): string {
  if (!(err instanceof FirebaseError)) return "Something went wrong. Please try again.";

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "ASHA ID or password is incorrect.";
    case "auth/email-already-in-use":
      return "This ASHA ID is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "No network. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a few minutes and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase.";
    default:
      return "Something went wrong. Please try again.";
  }
}