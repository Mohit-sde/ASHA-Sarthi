import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config";
import { createOnce, DuplicateError } from "./idempotent";
import { COLLECTIONS, type NewRecordInput, type RecordDoc } from "./types";

const DAY = 24 * 60 * 60 * 1000;
const toRecord = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as RecordDoc;

/**
 * submitId is generated once per form opening. A double-click or retry reuses it,
 * so the same record is never written twice. A separate check rejects an identical
 * value for the same patient and type within 24 hours.
 */
export async function addRecord(uid: string, submitId: string, input: NewRecordInput) {
  const col = collection(db, COLLECTIONS.records);
  const value = input.value.trim();

  const sameType = await getDocs(
    query(
      col,
      where("ashaUid", "==", uid),
      where("patientId", "==", input.patientId),
      where("type", "==", input.type),
    ),
  );
  const cutoff = Date.now() - DAY;
  const recent = sameType.docs.some((d) => {
    const r = d.data();
    const at = r.recordedAt?.toMillis?.() ?? Date.now(); // pending writes count as now
    return r.value === value && at > cutoff;
  });
  if (recent) {
    throw new DuplicateError("This record was already saved for this patient in the last 24 hours.");
  }

  return createOnce(
    COLLECTIONS.records,
    `${uid}_${submitId}`,
    {
      ashaUid: uid,
      patientId: input.patientId,
      patientName: input.patientName.trim(),
      patientCode: input.patientCode.trim(),
      type: input.type,
      value,
      notes: input.notes.trim(),
      recordedAt: serverTimestamp(),
    },
    "ignore", // a retried submit is treated as success
    "",
  );
}

// All of this worker's records, newest first. Uses the existing (ashaUid, recordedAt DESC) index.
export function subscribeRecords(
  uid: string,
  onData: (records: RecordDoc[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.records),
    where("ashaUid", "==", uid),
    orderBy("recordedAt", "desc"),
    limit(500),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(toRecord).filter((r) => r.ashaUid === uid)),
    onError,
  );
}