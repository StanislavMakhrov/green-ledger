import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLedger",
  description: "Carbon emissions tracking for Acme GmbH",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
