export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen antialiased" style={{ fontFamily: "var(--font-jakarta, system-ui), -apple-system, 'Segoe UI', sans-serif" }}>{children}</div>;
}
