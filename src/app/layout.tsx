import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLedger",
  description: "CSRD/ESRS Climate Reporting for German SMEs",
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
