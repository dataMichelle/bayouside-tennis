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
    <aside className="w-full md:w-64 bg-gray-800 text-white bg-opacity-80 border-b md:border-r md:border-b-0 border-swamp-400 border-opacity-40 shadow-md px-4 py-3 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-primary-700 dark:text-primary-200 mb-4 md:mb-6 text-center md:text-left">
        {sidebarTitle}
      </h2>
      <nav className="flex flex-row flex-wrap justify-center gap-1 sm:gap-2 md:flex-col md:justify-start md:gap-4 w-full max-w-xs mx-auto whitespace-nowrap">
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`font-medium text-sm md:text-lg transition-colors py-2 px-4 rounded-md ${
              pathname === link.path
                ? "bg-primary-100 dark:bg-neutrals-800 text-primary-600 dark:text-primary-300"
                : "text-primary-900 dark:text-primary-100 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-neutrals-800 hover:bg-swamp-200-xs"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
