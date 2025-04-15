"use client";

import { FaMapMarkerAlt, FaPhoneAlt, FaInfoCircle } from "react-icons/fa";

export default function About() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">
        About Bayouside Tennis
      </h1>

      <div className="bg-swamp-200 dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto ">
        {/* Welcome Text */}
        <div className="text-center mb-6">
          <FaInfoCircle
            className="mx-auto text-swamp-700 dark:text-green-400 mb-2"
            size={28}
          />
          <p className="text-lg leading-relaxed text-swamp-700 mb-8">
            Welcome to Bayouside Tennis—a family-friendly spot in the bayou
            where kids and adults alike can enjoy tennis. Our private court,
            skilled coaches, and swampy charm make every visit a joy.
          </p>
        </div>

        {/* Address & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Address */}
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt
              className="text-swamp-700 dark:text-green-400 mt-1"
              size={20}
            />
            <div>
              <h2 className="text-xl font-medium text-swamp-700 mb-2">
                Location
              </h2>
              <p className=" text-left">
                123 Loreauville Rd.
                <br />
                New Iberia, LA 70563
                <br />
                Look for the green gator sign!
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex items-start gap-3">
            <FaPhoneAlt className=" dark:text-green-400 mt-1" size={20} />
            <div>
              <h2 className="text-xl font-medium text-swamp-700 mb-2">
                Contact
              </h2>
              <p className=" text-left">
                (337) 555-1234
                <br />
                Call us for bookings or questions!
              </p>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="text-swamp-600 italic mt-6 text-center">
          🗺️ Map coming soon—picture a winding bayou path to 123 Gator Lane with
          a tennis twist!
        </div>
      </div>
    </main>
  );
}
