import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/scope-1', label: 'Scope 1' },
  { href: '/scope-2', label: 'Scope 2' },
  { href: '/scope-3', label: 'Scope 3' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/export', label: 'Export' },
]

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-green-700">🌿 GreenLedger</h1>
          <p className="text-xs text-gray-500 mt-1">CSRD Climate Reporting</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">Demo GmbH · 2024</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
