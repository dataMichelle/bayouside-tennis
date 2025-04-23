import Link from "next/link";
import { baseLinks } from "@/utils/navLinks";

export default function StaticNav({ closeMenu }) {
  return (
    <nav className="flex flex-col sm:flex-row gap-2 sm:space-x-4 whitespace-nowrap">
      {baseLinks.map((link) => (
        <Link
          key={link.label}
          href={link.path}
          onClick={closeMenu}
          className="text-black text-sm hover:text-orange-700 hover:bg-taupe-300 rounded-md px-2 py-1"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
