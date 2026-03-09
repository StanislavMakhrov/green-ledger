"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/suppliers", label: "🏭 Suppliers" },
  { href: "/scope-1", label: "🔥 Scope 1" },
  { href: "/scope-2", label: "⚡ Scope 2" },
  { href: "/scope-3", label: "🌍 Scope 3" },
  { href: "/methodology", label: "📝 Methodology" },
  { href: "/export", label: "📄 Export" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-green-800 text-white flex flex-col min-h-screen">
      <div className="p-6">
        <h1 className="text-xl font-bold">🌿 GreenLedger</h1>
        <p className="text-green-300 text-sm mt-1">CSRD Climate Report</p>
      </div>
      <nav className="flex-1 px-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block py-2 px-3 rounded-md mb-1 transition-colors ${
              pathname === item.href
                ? "bg-green-600 text-white"
                : "text-green-100 hover:bg-green-700 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 text-xs text-green-400">MVP Demo · Musterfirma GmbH</div>
    </aside>
  );
}
