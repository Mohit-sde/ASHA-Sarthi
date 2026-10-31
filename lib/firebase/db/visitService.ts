import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config";
import { COLLECTIONS, type NewVisitInput, type VisitDoc, type VisitStatus } from "./types";
import { createOnce, slug } from "./idempotent";

export function addVisit(uid: string, input: NewVisitInput) {
  const id = `${uid}_${input.patientId}_${input.scheduledAt.getTime()}_${slug(input.type)}`;
  return createOnce(
    COLLECTIONS.visits,
    id,
    {
      ashaUid: uid,
      patientId: input.patientId,
      patientName: input.patientName.trim(),
      patientCode: input.patientCode.trim(),
      type: input.type,
      ward: input.ward,
      scheduledAt: Timestamp.fromDate(input.scheduledAt),
      durationMin: input.durationMin,
      status: "scheduled",
      notes: input.notes.trim(),
      createdAt: serverTimestamp(),
    },
    "throw",
    "This patient already has a visit of this type at this time.",
  );
}

export async function setVisitStatus(visitId: string, status: VisitStatus) {
  await updateDoc(doc(db, COLLECTIONS.visits, visitId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

const toVisit = (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() }) as VisitDoc;

export function subscribeVisitsBetween(
  uid: string,
  from: Date,
  to: Date,
  onData: (visits: VisitDoc[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.visits),
    where("ashaUid", "==", uid),
    where("scheduledAt", ">=", Timestamp.fromDate(from)),
    where("scheduledAt", "<", Timestamp.fromDate(to)),
    orderBy("scheduledAt"),
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map(toVisit)), onError);
}

// Full history for one worker, newest first.
// Uses the existing (ashaUid ASC, scheduledAt ASC) index, then reverses on the client.
export function subscribeAllVisits(
  uid: string,
  onData: (visits: VisitDoc[]) => void,
  onError?: (err: Error) => void,
) {
  const q = query(
    collection(db, COLLECTIONS.visits),
    where("ashaUid", "==", uid),
    orderBy("scheduledAt"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const visits = snap.docs
        .map(toVisit)
        .filter((v) => v.ashaUid === uid) // only the authorized worker's visits
        .reverse();
      onData(visits);
    },
    onError,
  );
}