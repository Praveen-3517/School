import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  Users,
  UserCheck,
  GanttChart,
  BookOpen,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminRecentActivity } from "@/components/admin/admin-recent-activity";
import { AdminAttendanceChart } from "@/components/admin/admin-attendance-chart";
import { AdminPerformanceChart } from "@/components/admin/admin-performance-chart";
import { formatDate, formatRelativeTime } from "@/lib/utils/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
};

async function getDashboardData() {
  const [
    totalStudents,
    activeStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    currentSession,
    recentStudents,
    recentAuditLogs,
    attendanceStats,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.academicSession.findFirst({ where: { isCurrent: true } }),
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        enrollmentNumber: true,
        createdAt: true,
        status: true,
        profile: { select: { firstName: true, lastName: true } },
        enrollments: {
          where: { isActive: true },
          take: 1,
          select: {
            section: {
              select: { name: true, class: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        createdAt: true,
        actor: { select: { name: true, role: true } },
      },
    }).then(logs => logs.map(log => ({ ...log, action: log.action as import("@/types/enums").AuditAction }))),
    // Attendance overview for last 7 days
    prisma.attendance.groupBy({
      by: ["status"],
      _count: { status: true },
      where: {
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalStudents,
    activeStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    currentSession,
    recentStudents,
    recentAuditLogs,
    attendanceStats,
  };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getDashboardData();

  const stats = [
    {
      label: "Total Students",
      value: data.totalStudents,
      subtitle: `${data.activeStudents} active`,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/50",
      href: "/admin/students",
    },
    {
      label: "Teachers",
      value: data.totalTeachers,
      subtitle: "On staff",
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      href: "/admin/teachers",
    },
    {
      label: "Classes",
      value: data.totalClasses,
      subtitle: "Grade levels",
      icon: GanttChart,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/50",
      href: "/admin/academic/classes",
    },
    {
      label: "Subjects",
      value: data.totalSubjects,
      subtitle: "Across all grades",
      icon: BookOpen,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/50",
      href: "/admin/academic/subjects",
    },
  ];

  const presentCount =
    data.attendanceStats.find((s) => s.status === "PRESENT")?._count.status ?? 0;
  const absentCount =
    data.attendanceStats.find((s) => s.status === "ABSENT")?._count.status ?? 0;
  const lateCount =
    data.attendanceStats.find((s) => s.status === "LATE")?._count.status ?? 0;
  const totalAttendance = presentCount + absentCount + lateCount;
  const attendanceRate =
    totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back! Here&apos;s an overview of {process.env.NEXT_PUBLIC_APP_NAME ?? "EduManage"}.
            {data.currentSession && (
              <span className="ml-2">
                <Badge variant="secondary" className="text-xs">
                  {data.currentSession.name}
                </Badge>
              </span>
            )}
          </p>
        </div>
        <div className="text-sm text-muted-foreground hidden md:block">
          {formatDate(new Date(), "EEEE, dd MMM yyyy")}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link 
            key={stat.label} 
            href={stat.href} 
            className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-xl outline-none"
            aria-label={`View ${stat.label} management`}
          >
            <Card className="hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold mt-1 group-hover:text-primary transition-colors">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bg} group-hover:scale-110 group-hover:shadow-sm transition-all duration-300`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Attendance Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Attendance (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Rate</span>
                <span className="text-lg font-bold text-emerald-600">
                  {attendanceRate}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-2">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {presentCount}
                  </p>
                  <p className="text-muted-foreground">Present</p>
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    {absentCount}
                  </p>
                  <p className="text-muted-foreground">Absent</p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                    {lateCount}
                  </p>
                  <p className="text-muted-foreground">Late</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Recent Enrollments
              </CardTitle>
              <a
                href="/admin/students"
                className="text-xs text-primary hover:underline"
              >
                View all
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students enrolled yet.
                </p>
              ) : (
                data.recentStudents.map((student) => {
                  const enrollment = student.enrollments[0];
                  return (
                    <div
                      key={student.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {student.profile?.firstName?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {student.profile
                              ? `${student.profile.firstName} ${student.profile.lastName}`
                              : student.enrollmentNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.enrollmentNumber}
                            {enrollment?.section && (
                              <> · {enrollment.section.class.name}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={student.status === "ACTIVE" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {student.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(student.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system events and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminRecentActivity logs={data.recentAuditLogs} />
        </CardContent>
      </Card>
    </div>
  );
}
