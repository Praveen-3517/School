import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Attendance | EduManage",
  description: "Mark daily attendance for your classes.",
};

interface TeacherAttendancePageProps {
  searchParams: Promise<{ date?: string; assignmentId?: string }>;
}

export default async function TeacherAttendancePage(props: TeacherAttendancePageProps) {
  const searchParams = await props.searchParams;
  const session = await requireSession();

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      assignments: {
        include: {
          subject: true,
          section: { include: { class: true } },
          academicSession: true
        }
      }
    }
  });

  if (!teacher) {
    return <div>Teacher profile not found. Please contact an administrator.</div>;
  }

  // Determine selected date (default to today if not provided)
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDateStr = searchParams.date || todayStr;
  const selectedDate = new Date(selectedDateStr);
  
  // Prevent selecting future dates in UI logic here
  const isFutureDate = selectedDate > new Date();

  const selectedAssignmentId = searchParams.assignmentId;
  const selectedAssignment = teacher.assignments.find(a => a.id === selectedAssignmentId);

  let students: any[] = [];
  let existingRecords: any[] = [];

  if (selectedAssignment && selectedAssignment.sectionId && !isFutureDate) {
    // Fetch students enrolled in this section for the specific academic session
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        sectionId: selectedAssignment.sectionId,
        academicSessionId: selectedAssignment.academicSessionId,
      },
      include: {
        student: {
          include: { user: true }
        }
      },
      orderBy: { rollNumber: 'asc' }
    });

    students = enrollments.map(e => ({
      id: e.studentId,
      name: e.student.user.name,
        enrollmentNo: e.student.enrollmentNumber
    }));

    // Fetch existing attendance records for this date and subject
    existingRecords = await prisma.attendance.findMany({
      where: {
        sectionId: selectedAssignment.sectionId,
        date: selectedDate,
        subjectId: selectedAssignment.subjectId || null,
        studentId: { in: students.map(s => s.id) }
      }
    });
  }

  // Pre-generate a few recent dates for quick selection
  const recentDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  if (!recentDates.includes(selectedDateStr) && !isFutureDate) {
    recentDates.unshift(selectedDateStr);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Attendance Tracking</h2>
        <p className="text-muted-foreground">Mark daily or subject-wise attendance for your assigned classes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Date</CardTitle>
            <CardDescription>Choose the date for attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {recentDates.map(ds => (
                <Link 
                  key={ds} 
                  href={`?date=${ds}${selectedAssignmentId ? `&assignmentId=${selectedAssignmentId}` : ''}`}
                >
                  <Badge variant={selectedDateStr === ds ? "default" : "outline"} className="text-sm py-1 px-3 cursor-pointer hover:bg-primary/80">
                    {ds === todayStr ? "Today" : format(new Date(ds), "MMM dd")}
                  </Badge>
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Custom Date:</span>
              <input 
                type="date" 
                max={todayStr}
                value={selectedDateStr}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  if(e.target.value) {
                     // The redirection would happen via client side router in a real app,
                     // but here we can just rely on the user clicking the links, or using a client component wrapper.
                     // For simplicity, we just show standard links above.
                  }
                }}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Select Class</CardTitle>
            <CardDescription>Choose from your assigned classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {teacher.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no assigned classes.</p>
            ) : (
              teacher.assignments.map(assignment => (
                <Link 
                  key={assignment.id} 
                  href={`?date=${selectedDateStr}&assignmentId=${assignment.id}`}
                  className={`flex justify-between items-center p-3 rounded-md border transition-colors hover:bg-accent ${selectedAssignmentId === assignment.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div>
                    <div className="font-medium">Class {assignment.section?.class.name} - {assignment.section?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {assignment.subject?.name || "General"}
                    </div>
                  </div>
                  <Badge variant="outline">{assignment.academicSession.name}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {isFutureDate && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 mt-6">
          You cannot mark attendance for a future date.
        </div>
      )}

      {selectedAssignment && !isFutureDate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Attendance Roster</CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM do, yyyy")} | Class {selectedAssignment.section?.class.name} - {selectedAssignment.section?.name} {selectedAssignment.subject ? `| ${selectedAssignment.subject.name}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTable 
              date={selectedDateStr}
              sectionId={selectedAssignment.sectionId!}
              subjectId={selectedAssignment.subjectId || undefined}
              academicSessionId={selectedAssignment.academicSessionId}
              students={students}
              existingRecords={existingRecords}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
