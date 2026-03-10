"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
}

/**
 * Client component for sidebar navigation links with active state highlighting.
 * Uses usePathname() to determine the active route.
 */
export function NavLink({ href, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-green-600 text-white"
          : "text-green-100 hover:bg-green-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
