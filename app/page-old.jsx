"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <section className="hero relative min-h-[400px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-swamp-100 to-teal-200 dark:from-swamp-600 dark:to-teal-300">
        <div className="hero-content flex flex-col md:flex-row items-center justify-between max-w-5xl mx-auto w-full">
          <div className="hero-text text-center md:text-left md:w-1/2 p-6 z-10 animate-slide-in-left">
            <h1>Welcome to Bayouside Tennis!</h1>
            <p className="text-lg text-swamp-600 dark:text-swamp-200 mb-6">
              Book a court, grab a coach, or rent a ball machine—fun for kids
              and adults alike!
            </p>
            <Link
              href="/booking"
              className="inline-block px-6 py-3 bg-gradient-to-r from-taupe-300 to-swamp-400 text-white font-semibold rounded-xl hover:from-taupe-400 hover:to-swamp-500 transition-all"
            >
              Book Now
            </Link>
          </div>
          <div className="hero-image md:w-1/2 h-[300px] md:h-[400px] relative animate-slide-in-right">
            <img
              src="/gator-racket.png"
              alt="Tennis Court"
              className="object-cover w-full h-full rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
