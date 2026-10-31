import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config";
import { slug } from "./idempotent";
import { COLLECTIONS, type PatientDoc, type PatientInput } from "./types";

const toPatient = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as PatientDoc;

export function subscribePatients(
  uid: string,
  onData: (patients: PatientDoc[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(collection(db, COLLECTIONS.patients), where("ashaUid", "==", uid));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs
          .map(toPatient)
          .filter((p) => p.ashaUid === uid)
          .sort((a, b) => a.name.localeCompare(b.name)),
      ),
    onError,
  );
}

/**
 * One patient per worker per patient ID (or per name when no ID is given).
 * The document ID is derived from that key, so repeated saves always hit the same
 * document inside a transaction instead of creating a new one.
 */
export async function upsertPatient(uid: string, input: PatientInput): Promise<string> {
  const name = input.name.trim();
  const code = input.patientCode?.trim() ?? "";
  const key = code ? `code-${slug(code)}` : `name-${slug(name)}`;
  const id = `${uid}_${key}`;
  const ref = doc(db, COLLECTIONS.patients, id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists()) {
      tx.set(ref, {
        ashaUid: uid,
        name,
        nameLower: name.toLowerCase(),
        patientCode: code,
        age: input.age ?? null,
        category: input.category ?? null,
        ward: input.ward ?? "",
        condition: input.condition?.trim() ?? "",
        criticalLevel: input.criticalLevel ?? "none",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Update only the fields that were provided, so a partial form never blanks data.
    const patch: DocumentData = { name, nameLower: name.toLowerCase(), updatedAt: serverTimestamp() };
    if (code) patch.patientCode = code;
    if (input.age !== undefined) patch.age = input.age;
    if (input.category) patch.category = input.category;
    if (input.ward) patch.ward = input.ward;
    if (input.condition !== undefined) patch.condition = input.condition.trim();
    if (input.criticalLevel) patch.criticalLevel = input.criticalLevel;
    tx.update(ref, patch);
  });

  return id;
}