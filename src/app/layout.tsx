import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../../context/authContext";

export const metadata: Metadata = {
  title: "ASHA-Sarthi",
  description: "AI Voice-to-EHR Co-Pilot for ASHA workers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}