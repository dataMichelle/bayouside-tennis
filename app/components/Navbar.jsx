// components/Navbar.jsx
"use client";
import StaticNav from "./StaticNav";
import dynamic from "next/dynamic";

// Load UserNav client-only
const UserNav = dynamic(() => import("./UserNav"), { ssr: false });

export default function Navbar() {
  return (
    <header className="relative z-[100]">
      <div className="fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] w-auto max-w-4xl px-6 rounded-full border border-swamp-400 border-opacity-40 bg-taupe-200 bg-opacity-80 shadow-[0px_8px_16px_rgba(34,85,34,1)] backdrop-blur-[0.5rem] flex items-center gap-4 font-nunito animate-jiggle">
        <StaticNav />
        <UserNav />
      </div>
    </header>
  );
}
