export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="fs-dashboard-root" className="min-h-0 bg-slate-100">
      {children}
    </div>
  );
}
