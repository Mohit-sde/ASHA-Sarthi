"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { subscribeVisitsBetween } from "../lib/firebase/db/visitService";
import { startOfDay, type VisitDoc } from "../lib/firebase/db/types";

export function useVisitsBetween(from: Date, to: Date) {
  const { user } = useAuth();
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const [visits, setVisits] = useState<VisitDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    return subscribeVisitsBetween(
      user.uid,
      new Date(fromMs),
      new Date(toMs),
      (v) => {
        setVisits(v);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user, fromMs, toMs]);

  return { visits, loading, error };
}

export function useVisitsForDay(day: Date) {
  const from = startOfDay(0);
  from.setTime(new Date(day).setHours(0, 0, 0, 0));
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return useVisitsBetween(from, to);
}