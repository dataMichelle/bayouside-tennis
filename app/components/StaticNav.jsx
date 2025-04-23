import Link from "next/link";
import { baseLinks } from "@/utils/navLinks";

export default function StaticNav({ closeMenu, isMobile }) {
  return (
    <nav className="flex flex-col sm:flex-row gap-2 sm:space-x-4 whitespace-nowrap">
      {baseLinks.map((link) => (
        <Link
          key={link.label}
          href={link.path}
          onClick={closeMenu}
          className={`text-black text-sm rounded-md px-2 py-1 ${
            isMobile
              ? "hover:bg-taupe-400 hover:text-white"
              : "hover:text-black"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
