// components/DashboardHeader.jsx
export default function DashboardHeader({ title }) {
  return (
    <h1 className="text-3xl font-bold text-primary-700 mb-6 text-center">
      {title}
    </h1>
  );
}
