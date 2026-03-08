"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/scope-1", label: "Scope 1" },
  { href: "/scope-2", label: "Scope 2" },
  { href: "/scope-3", label: "Scope 3" },
  { href: "/methodology", label: "Methodology" },
  { href: "/export", label: "Export" },
  { href: "/audit", label: "Audit Trail" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <nav className="w-56 flex-shrink-0 bg-green-800 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-green-700">
          <span className="text-xl font-bold tracking-tight">🌿 GreenLedger</span>
        </div>
        <ul className="flex-1 py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-600 text-white"
                      : "text-green-100 hover:bg-green-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="px-6 py-3 border-t border-green-700 text-xs text-green-300">
          Acme GmbH · 2024
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
