export type Role = "asha" | "supervisor" | "admin"; // extend as needed

export interface WorkerDetails {
  email: string | null;
  mobile: string | null;
  address: string | null;
}

export interface WorkerProfile extends WorkerDetails {
  uid: string;
  displayName: string;
  ashaId: string | null; // string for ASHA ID users, null for Google users
  role: Role;
  provider: "google" | "password";
  createdAt: unknown; // Firestore Timestamp
  lastLoginAt: unknown; // Firestore Timestamp
}