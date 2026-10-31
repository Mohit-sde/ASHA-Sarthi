export type UserRole = "asha" | "anm" | "supervisor";

export interface WorkerProfile {
  uid: string;
  displayName: string | null;
  ashaId: string | null;
  role: UserRole;
  provider: "google" | "password";
}