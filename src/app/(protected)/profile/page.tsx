"use client";

import { useState } from "react";
import { useAuth } from "../../../../context/authContext"; // adjust to your export name
import { Avatar, Badge, Card, PageHeader, PageShell, StatTile, Switch } from "../../../../components/ui/Kit";

const ASSIGNMENT = [
  { label: "District", value: "Demo District" },
  { label: "Block / PHC", value: "Demo PHC 12" },
  { label: "Villages covered", value: "6 (Ward 1–9)" },
  { label: "Supervisor", value: "Demo Supervisor" },
];

export default function ProfilePage() {
  const { user, profile } = useAuth();

  const name = profile?.displayName ?? user?.displayName ?? "ASHA worker";
  const role = profile?.role ?? "asha";
  const method = profile?.provider === "google" ? "Google" : "ASHA ID";

  const [notifications, setNotifications] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [language, setLanguage] = useState("English");

  return (
    <PageShell>
      <PageHeader
        title="Profile"
        subtitle="Your account, assignment and preferences"
        actions={
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95"
          >
            Edit profile
          </button>
        }
      />

      {/* Identity card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-600 to-indigo-800" />
        <div className="relative flex flex-col items-center gap-4 pt-8 text-center sm:flex-row sm:items-end sm:text-left">
          <div className="rounded-full bg-white p-1 shadow-md">
            <Avatar name={name} size="lg" />
          </div>
          <div className="min-w-0 flex-1 space-y-1 pb-1">
            <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="indigo">{role.toUpperCase()}</Badge>
              <Badge>Signed in with {method}</Badge>
              {profile?.ashaId && <Badge>{profile.ashaId}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Years of service" value="4" tone="indigo" />
        <StatTile label="Visits this year" value="412" tone="emerald" />
        <StatTile label="Patients registered" value="138" tone="amber" />
        <StatTile label="Training completed" value="9/10" tone="rose" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-gray-900">Assignment</h2>
          <dl className="divide-y divide-gray-100 text-sm">
            {ASSIGNMENT.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <dt className="text-gray-500">{row.label}</dt>
                <dd className="font-medium text-gray-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-gray-900">Preferences</h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Push notifications</p>
                <p className="text-xs text-gray-500">Alerts and schedule changes</p>
              </div>
              <Switch checked={notifications} onChange={setNotifications} label="Push notifications" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Offline sync</p>
                <p className="text-xs text-gray-500">Save visits locally when there's no network</p>
              </div>
              <Switch checked={offlineSync} onChange={setOfflineSync} label="Offline sync" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">SMS reminders</p>
                <p className="text-xs text-gray-500">Send reminders to patients</p>
              </div>
              <Switch checked={smsReminders} onChange={setSmsReminders} label="SMS reminders" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-900">Language</p>
                <p className="text-xs text-gray-500">App display language</p>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option>English</option>
                <option>हिन्दी</option>
                <option>ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-gray-900">Account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Sign out from the sidebar. Changes to your ASHA ID or role need an administrator.
        </p>
      </Card>
    </PageShell>
  );
}