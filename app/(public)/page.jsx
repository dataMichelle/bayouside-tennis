"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="min-h-screen p-6 flex items-center justify-center overflow-hidden home">
      {/* Hero Content */}
      <div className="relative w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between z-10">
        {/* Hero Text */}
        <motion.div
          className="hero-text text-center md:text-left md:w-1/2 p-6 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className=" text-taupe-200 flex flex-col items-center items-start text-4xl space-y-2">
            <span className="text-nowrap text-5xl">Welcome to </span>

            <span className="font-chelsea text-5xl text-orange-900 text-nowrap">
              Bayouside Tennis!
            </span>
          </h1>

          <p className="text-xl  text-taupe-200 mb-10">
            Y’all ready to rally? The bayou is calling, and the court is
            waiting!
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/booking"
              className="inline-block px-6 py-3 bg-taupe-200 text-swamp-600 font-semibold rounded-xl shadow-md hover:bg-taupe-300 transition-all"
            >
              Book Now
            </Link>
          </motion.div>
        </motion.div>

        {/* Gator Image */}
        <img
          src="/gator-racket2.png"
          alt="Gator Playing Tennis"
          className="w-[70%] h-auto drop-shadow-2xl"
        />
      </div>
    </main>
  );
}
