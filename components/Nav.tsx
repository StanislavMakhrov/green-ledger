/**
 * Sidebar navigation component for the main app shell.
 *
 * Links to all internal pages. Uses Next.js Link for client-side navigation.
 * Marked as a client component so it can use usePathname() to highlight the
 * active route.
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { href: '/scope-1', label: 'Scope 1', icon: '🔥' },
  { href: '/scope-2', label: 'Scope 2', icon: '⚡' },
  { href: '/scope-3', label: 'Scope 3', icon: '🌍' },
  { href: '/methodology', label: 'Methodology', icon: '📝' },
  { href: '/export', label: 'Export PDF', icon: '📄' },
]

/** Sidebar navigation with active-route highlighting. */
export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-green-700">🌿 GreenLedger</span>
        <p className="text-xs text-gray-400 mt-0.5">CSRD Climate Reporting</p>
      </div>

      {/* Links */}
      <ul className="flex-1 py-4 space-y-0.5 px-2">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">Demo — Mustermann GmbH</p>
        <p className="text-xs text-gray-400">Reporting Year: 2024</p>
      </div>
    </nav>
  )
}
