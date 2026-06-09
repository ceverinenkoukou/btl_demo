import { AuthProvider } from "@/components/providers/auth-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="lg:pl-64 pt-14 lg:pt-0">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
