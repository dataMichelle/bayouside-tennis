import Sidebar from "@/components/Sidebar";

export default function PlayerDashboard() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
      </main>
    </div>
  );
}
