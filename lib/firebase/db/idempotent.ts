import { doc, runTransaction, type DocumentData } from "firebase/firestore";
import { db } from "../config";

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateError";
  }
}

// Makes a string safe for use inside a Firestore document ID.
export const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";

/**
 * Creates a document only if no document with this ID exists.
 * "throw" raises DuplicateError when it exists; "ignore" returns created: false.
 */
export function createOnce(
  collectionName: string,
  id: string,
  data: DocumentData,
  onExists: "throw" | "ignore",
  message: string,
): Promise<{ id: string; created: boolean }> {
  const ref = doc(db, collectionName, id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      if (onExists === "throw") throw new DuplicateError(message);
      return { id, created: false };
    }
    tx.set(ref, data);
    return { id, created: true };
  });
}