export default function PageContainer({ title, children, className }) {
  return (
    <main className={`p-6 pt-25 ${className || ""}`}>
      <h1 className="text-3xl font-bold text-center mb-6">{title}</h1>
      <div className="bg-swamp-200 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
        {children}
      </div>
    </main>
  );
}
