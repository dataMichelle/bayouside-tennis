"use client";
import Link from "next/link";

export default function Players() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold  mb-6 text-center">
        Player Information
      </h1>
      <div className="bg-swamp-200  dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <section className="space-y-8">
          {/* Rules of Conduct */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Rules of Conduct
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              All players must adhere to our court etiquette and safety
              guidelines. For full details:
            </p>
            <Link
              href="/players/rules-of-conduct"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              View Rules of Conduct
            </Link>
          </div>

          {/* Ball Machine Rental */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Ball Machine Rental
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              A ball machine is available for rental to enhance your practice
              sessions. Cost: $10/hr. Contact the front desk to reserve.
            </p>
            <Link
              href="/booking"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              Book a Court with Ball Machine
            </Link>
          </div>

          {/* Operating Hours */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Operating Hours
            </h2>
            <ul className="text-neutrals-700 dark:text-neutrals-300 list-disc list-inside">
              <li>Monday - Friday: 8:00 AM - 8:00 PM</li>
              <li>Saturday: 9:00 AM - 6:00 PM</li>
              <li>Sunday: 10:00 AM - 4:00 PM</li>
            </ul>
          </div>

          {/* Court Booking */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Court Booking
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              Ready to play? Book a court online—coaches and ball machines
              optional.
            </p>
            <Link
              href="/booking"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              Book a Court Now
            </Link>
          </div>

          {/* Contact Us */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Contact Us
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              Questions? Reach out to our staff for assistance.
            </p>
            <Link
              href="/contact"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              Contact Information
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
