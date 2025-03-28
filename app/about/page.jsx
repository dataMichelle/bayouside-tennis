export default function About() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold  mb-6 text-center">
        About Bayouside Tennis
      </h1>
      <div className="bg-swamp-200  dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        {/* Welcome Text */}
        <p className="text-lg leading-relaxed text-swamp-700 text-center">
          Welcome to Bayouside Tennis—a family-friendly spot in the bayou where
          kids and adults alike can enjoy tennis. Our private court, skilled
          coaches, and swampy charm make every visit a joy.
        </p>

        {/* Address & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Address */}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-xl font-medium text-swamp-700 mb-2">
              Location
            </h2>
            <p className="text-swamp-600 text-center md:text-left">
              123 Gator Lane
              <br />
              Swampville, LA 70501
              <br />
              Look for the green gator sign!
            </p>
          </div>

          {/* Phone */}
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-xl font-medium text-swamp-700 mb-2">Contact</h2>
            <p className="text-swamp-600 text-center md:text-left">
              (337) 555-1234
              <br />
              Call us for bookings or questions!
            </p>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="text-swamp-600 italic mt-6 text-center">
          Map coming soon—picture a winding bayou path to 123 Gator Lane with a
          tennis twist!
        </div>
      </div>
    </main>
  );
}
