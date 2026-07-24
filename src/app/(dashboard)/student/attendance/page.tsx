import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = {
  title: "My Attendance | EduManage",
  description: "View your attendance history.",
};

export default async function StudentAttendancePage() {
  const session = await requireSession();

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      attendance: {
        include: {
          subject: true,
        },
        orderBy: { date: "desc" }
      }
    }
  });

  if (!student) {
    return <div>Student profile not found.</div>;
  }

  // Calculate stats
  const totalDays = student.attendance.length;
  const presentDays = student.attendance.filter(a => a.status === "PRESENT").length;
  const absentDays = student.attendance.filter(a => a.status === "ABSENT").length;
  const lateDays = student.attendance.filter(a => a.status === "LATE").length;
  const halfDays = student.attendance.filter(a => a.status === "HALF_DAY").length;
  
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Attendance</h2>
        <p className="text-muted-foreground">Comprehensive view of your presence logs.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{attendancePercentage}%</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{presentDays}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{absentDays}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{lateDays}</div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1 border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Half Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{halfDays}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Detailed chronological record.</CardDescription>
        </CardHeader>
        <CardContent>
          {student.attendance.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendance records found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.attendance.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium">
                      {new Date(att.date).toLocaleDateString(undefined, { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell>
                      {att.subject ? att.subject.name : "Daily/Homeroom"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        att.status === "PRESENT" ? "bg-green-100 text-green-700" :
                        att.status === "ABSENT" ? "bg-red-100 text-red-700" :
                        att.status === "LATE" ? "bg-yellow-100 text-yellow-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {att.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {att.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
