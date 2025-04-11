// app/components/CoachOwnerNavbar.jsx
"use client";

import Link from "next/link";

export default function CoachOwnerNavbar() {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex justify-center space-x-4">
        <li>
          <Link href="/dashboard/coach">Coach Dashboard</Link>
        </li>
        <li>
          <Link href="/dashboard/owner">Owner Dashboard</Link>
        </li>
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/logout">Logout</Link>
        </li>
      </ul>
    </nav>
  );
}
