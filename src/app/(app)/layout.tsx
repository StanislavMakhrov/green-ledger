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
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-green-800 text-white flex flex-col">
        <div className="p-4 border-b border-green-700">
          <h1 className="text-xl font-bold">🌿 GreenLedger</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded hover:bg-green-700 text-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
