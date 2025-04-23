"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import StaticNav from "./StaticNav";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const UserNav = dynamic(() => import("./UserNav"), { ssr: false });

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="relative z-[100] w-full">
      {/* Desktop Nav */}
      <div className="hidden sm:flex fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] w-auto max-w-4xl px-4 rounded-full border border-swamp-400 border-opacity-40 bg-taupe-200 bg-opacity-80 shadow-[0px_8px_16px_rgba(34,85,34,1)] backdrop-blur-[0.5rem] items-center gap-4 font-nunito animate-jiggle">
        <StaticNav />
        <Suspense
          fallback={<div className="text-sm text-gray-500">Loading...</div>}
        >
          <UserNav />
        </Suspense>
      </div>

      {/* Mobile Menu (including toggle button) */}
      {isMobileMenuOpen && (
        <div className="sm:hidden absolute top-4 right-4 w-64 px-4 py-4 bg-taupe-200 shadow-md z-[200] rounded-md font-nunito text-sm">
          <div className="flex justify-end mb-2">
            <button onClick={closeMenu} className="p-2 rounded-md text-black">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <Suspense
              fallback={<div className="text-sm text-gray-500">Loading...</div>}
            >
              <StaticNav closeMenu={closeMenu} isMobile={true} />
              <UserNav closeMenu={closeMenu} isMobile={true} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Hamburger toggle if menu not open */}
      {!isMobileMenuOpen && (
        <div className="sm:hidden fixed top-4 right-4 z-[200] ">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="bg-taupe-200 p-2 rounded-md shadow-md"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      )}
    </header>
  );
}
