"use client";

import { Home, Info, List, Mail, User2Icon } from "lucide-react";
import Link from "next/link";

export default function StickyNavbar() {
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/results", label: "Data", icon: Info },
    { href: "/frontend", label: "Scouting", icon: List },
    { href: "profile", label: "Profile", icon: User2Icon },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-black-900/80 backdrop-blur border-black-800 mt-[1.4rem]">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex gap-6 py-3">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                className="
              flex items-center gap-2 text-sm font-medium
              text-gray-300
              hover:text-blue-400
              transition-colors
            "
              >
                <Icon className="h-4 w-4 text-blue-400" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
