"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";

export default function Players() {
  const [settings, setSettings] = useState({
    ballMachineCost: 10, // Default to 10 until fetched
    courtRentalCost: 20, // Default to 20 until fetched
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/player/info", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (res.ok) {
          setSettings({
            ballMachineCost: data.ballMachineCost,
            courtRentalCost: data.courtRentalCost,
          });
        } else {
          throw new Error(data.error || "Failed to fetch settings data");
        }
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <PageContainer title="Player Information">
      <div className=" dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        <section className="space-y-8">
          {/* Rules of Conduct */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Rules of Conduct
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              All players must adhere to the following court etiquette and
              safety guidelines:
            </p>
            <ul className="text-neutrals-700 dark:text-neutrals-300 list-disc list-inside">
              <li>
                Arrive 10 minutes early to check in and prepare for your
                session.
              </li>
              <li>
                Wear proper tennis shoes with non-marking soles to protect the
                court.
              </li>
              <li>
                Respect court time limits and vacate promptly when your session
                ends.
              </li>
              <li>
                Cancel bookings at least 24 hours in advance to avoid fees.
              </li>
              <li>
                Maintain sportsmanship; avoid disruptive behavior during play.
              </li>
            </ul>
          </div>

          {/* Ball Machine Rental */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Ball Machine Rental
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              A ball machine is available for rental to enhance your practice
              sessions. Cost: ${settings.ballMachineCost}/hr. Contact the front
              desk to reserve.
            </p>
            <Link
              href="/booking"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              Book a Court with Ball Machine
            </Link>
          </div>

          {/* Court Rental Cost */}
          <div>
            <h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-300 mb-4">
              Court Rental Cost
            </h2>
            <p className="text-neutrals-700 dark:text-neutrals-300 mb-2">
              Reserve a court for your practice or match. Cost: $
              {settings.courtRentalCost}/hr. Book online to secure your time.
            </p>
            <Link
              href="/booking"
              className="text-black font-medium hover:text-gray-700 transition-colors underline"
            >
              Book a Court Now
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
        </section>
      </div>
    </PageContainer>
  );
}
