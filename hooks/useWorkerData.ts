"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { subscribeAllVisits } from "../lib/firebase/db/visitService";
import { subscribePatients } from "../lib/firebase/db/patientService";
import type { PatientDoc, VisitDoc } from "../lib/firebase/db/types";
import { subscribeRecords } from "../lib/firebase/db/recordService";
import type { RecordDoc } from "../lib/firebase/db/types";

export function useAllVisits() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribeAllVisits(
      user.uid,
      (v) => {
        setVisits(v);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { visits, loading, error };
}

export function useRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribeRecords(
      user.uid,
      (r) => {
        setRecords(r);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { records, loading, error };
}

export function usePatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribePatients(
      user.uid,
      (p) => {
        setPatients(p);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { patients, loading, error };
}