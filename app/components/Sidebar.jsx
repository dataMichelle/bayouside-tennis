"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const sidebarLinks = [
    { path: "/dashboard", label: "Court Schedule" },
    { path: "/dashboard/payments", label: "Payments" },
    { path: "/dashboard/coaches", label: "Coaches" }, // Changed from /dashboard/instructors
  ];

  return (
    <aside className="w-64 bg-primary-50 dark:bg-neutrals-900 p-6 shadow-lg h-screen sticky top-0">
      <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-200 mb-6">
        Owner Menu
      </h2>
      <nav className="space-y-4">
        {sidebarLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`block text-primary-900 dark:text-primary-100 font-medium text-lg transition-colors py-2 px-4 rounded-md ${
              pathname === link.path
                ? "bg-primary-100 dark:bg-neutrals-800 text-primary-600 dark:text-primary-300"
                : "hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-100 dark:hover:bg-neutrals-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
