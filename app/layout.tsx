import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Strava Ride Share",
  description: "Generate a beautiful share image from your Strava ride.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
