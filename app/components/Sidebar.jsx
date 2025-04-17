"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardLinks } from "@/utils/dashboardLinks";

export default function Sidebar({ role }) {
  const links = dashboardLinks[role] || [];
  const pathname = usePathname(); // ✅ Add this to highlight the active link

  const sidebarTitle =
    {
      coach: "Coach Menu",
      owner: "Owner Menu",
    }[role] || "Dashboard";

  return (
    <aside className="w-64 bg-gray-800 text-white bg-opacity-80 border-r border-swamp-400 border-opacity-40 shadow-[0px_8px_16px_#545a54] p-6 h-screen sticky top-0">
      <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-200 mb-6">
        {sidebarTitle}
      </h2>
      <nav className="space-y-4">
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`block font-medium text-lg transition-colors py-2 px-4 rounded-md ${
              pathname === link.path
                ? "bg-primary-100 dark:bg-neutrals-800 text-primary-600 dark:text-primary-300"
                : "text-primary-900 dark:text-primary-100 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-neutrals-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
