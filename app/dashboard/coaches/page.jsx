import Sidebar from "../../components/Sidebar";

export default function DashboardCoaches() {
  return (
    <main className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 p-6 bg-neutrals-50 dark:bg-neutrals-900">
        <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-200 mb-6">
          Owner Dashboard - Coaches
        </h1>
        <div className="bg-white dark:bg-neutrals-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-primary-600 mb-4">
            Coaches
          </h2>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span>Jane Smith</span>
              <span className="text-primary-500">$30/hr</span>
            </li>
          </ul>
          <button className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors">
            Manage Coaches
          </button>
        </div>
      </div>
    </main>
  );
}
