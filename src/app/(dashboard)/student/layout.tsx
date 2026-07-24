import { requireSession } from "@/lib/auth/session";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { StudentSidebar } from "@/components/student/student-sidebar";
import { redirect } from "next/navigation";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  if (session.user.role !== "STUDENT") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <StudentSidebar user={session.user} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
