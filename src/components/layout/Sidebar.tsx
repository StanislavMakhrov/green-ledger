"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/suppliers", label: "Suppliers", icon: "🏢" },
  { href: "/scope-1", label: "Scope 1", icon: "🔥" },
  { href: "/scope-2", label: "Scope 2", icon: "⚡" },
  { href: "/scope-3", label: "Scope 3", icon: "🌍" },
  { href: "/methodology", label: "Methodology", icon: "📝" },
  { href: "/export", label: "Export", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">
              GreenLedger
            </h1>
            <p className="text-xs text-gray-500">CSRD Climate Reporting</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Demo GmbH · 2024</p>
      </div>
    </aside>
  );
}
