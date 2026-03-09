import { NavLink } from "./nav-link";

const navItems = [
  { href: "/dashboard", label: "🏠 Dashboard" },
  { href: "/suppliers", label: "🏭 Suppliers" },
  { href: "/scope-1", label: "🔥 Scope 1" },
  { href: "/scope-2", label: "⚡ Scope 2" },
  { href: "/scope-3", label: "🔗 Scope 3" },
  { href: "/methodology", label: "📋 Methodology" },
  { href: "/export", label: "📄 Export" },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 shadow-xl flex flex-col">
        <div className="p-6 border-b border-green-800">
          <h1 className="text-xl font-bold text-white">🌿 GreenLedger</h1>
          <p className="text-xs text-green-300 mt-1">CSRD Climate Reporting</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-green-800">
          <p className="text-xs text-green-400">Demo GmbH · 2024</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
