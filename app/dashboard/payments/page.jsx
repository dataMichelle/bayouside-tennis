import Sidebar from "../../components/Sidebar";

export default function Payments() {
  return (
    <main className="min-h-screen flex">
      {/* Sidebar on the Left */}
      <Sidebar />

      {/* Main Content Area - Payments */}
      <div className="flex-1 p-6 bg-neutrals-50 dark:bg-neutrals-900">
        <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-200 mb-6">
          Owner Dashboard - Payments
        </h1>
        <div className="bg-white dark:bg-neutrals-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">
            Payments
          </h2>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>John Doe - 9:00 AM</span>
              <span className="text-yellow-500">$20.00</span>
            </li>
          </ul>
          <button className="mt-4 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">
            Process Payment
          </button>
        </div>
      </div>
    </main>
  );
}
