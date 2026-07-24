import { requireSession } from "@/lib/auth/session";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar";
import { redirect } from "next/navigation";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  if (session.user.role !== "TEACHER") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <TeacherSidebar user={session.user} />

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
