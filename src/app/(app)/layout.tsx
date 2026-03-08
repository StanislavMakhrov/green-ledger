import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/scope-1", label: "Scope 1" },
  { href: "/scope-2", label: "Scope 2" },
  { href: "/scope-3", label: "Scope 3" },
  { href: "/methodology", label: "Methodology" },
  { href: "/export", label: "Export" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-green-900 text-white flex flex-col">
        <div className="px-6 py-5 border-b border-green-700">
          <span className="text-xl font-bold tracking-tight">🌿 GreenLedger</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-green-700 text-xs text-green-300">
          CSRD Climate Reporting
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
