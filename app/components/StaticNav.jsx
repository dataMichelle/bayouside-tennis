// components/StaticNav.jsx
import Link from "next/link";
import { baseLinks } from "@/utils/navLinks";

export default function StaticNav() {
  return (
    <nav className="flex space-x-4">
      {baseLinks.map((link) => (
        <Link
          key={link.label}
          href={link.path}
          className="text-black text-sm hover:text-orange-700"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
