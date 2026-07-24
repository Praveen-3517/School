import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { getEnrollmentStats, getPerformanceStats, getAttendanceTrend } from "@/lib/actions/report.actions";
import { EnrollmentChart } from "@/components/reports/enrollment-chart";
import { PerformanceChart } from "@/components/reports/performance-chart";
import { AttendanceTrendChart } from "@/components/reports/attendance-trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, GraduationCap, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Reports & Analytics | EduManage",
  description: "School-wide analytics and reports dashboard.",
};

export default async function ReportsPage() {
  await requireAdmin();

  // Fetch all report data in parallel
  const [enrollmentData, performanceData, attendanceData] = await Promise.all([
    getEnrollmentStats(),
    getPerformanceStats(),
    getAttendanceTrend(),
  ]);

  // Calculate some top-level KPI metrics
  const totalStudents = enrollmentData.reduce((acc, curr) => acc + curr.students, 0);
  const avgPerformance = performanceData.length > 0 
    ? Math.round(performanceData.reduce((acc, curr) => acc + curr.average, 0) / performanceData.length)
    : 0;
  
  const todayAttendance = attendanceData.length > 0 ? attendanceData[attendanceData.length - 1].rate : 0;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled in the current session
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance}%</div>
            <p className="text-xs text-muted-foreground">
              Across all recorded subjects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Based on the most recent daily record
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <AttendanceTrendChart data={attendanceData} />
        <EnrollmentChart data={enrollmentData} />
        <PerformanceChart data={performanceData} />
      </div>
    </div>
  );
}
