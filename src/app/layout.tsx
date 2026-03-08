import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLedger",
  description: "CSRD Climate Reporting Tool",
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/scope-1", label: "Scope 1" },
  { href: "/scope-2", label: "Scope 2" },
  { href: "/scope-3", label: "Scope 3" },
  { href: "/methodology", label: "Methodology" },
  { href: "/export", label: "Export" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <aside className="w-56 bg-emerald-800 text-white flex flex-col shrink-0">
          <div className="px-6 py-5 border-b border-emerald-700">
            <span className="text-xl font-bold tracking-tight">🌿 GreenLedger</span>
          </div>
          <nav aria-label="Main navigation" className="flex flex-col gap-1 p-3 flex-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="px-6 py-4 text-xs text-emerald-300 border-t border-emerald-700">
            CSRD Climate Reporting
          </div>
        </aside>
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
