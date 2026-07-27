import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, CalendarCheck, BookOpen, AlertCircle, User as UserIcon, CalendarClock } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Student Dashboard | EduManage",
  description: "Student portal for EduManage.",
};

export default async function StudentDashboard() {
  const session = await requireSession();

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch the student profile for this user
  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      profile: true,
      enrollments: {
        where: { isActive: true },
        include: {
          section: {
            include: { class: true }
          },
          academicSession: true
        },
        take: 1,
        orderBy: { academicSession: { startDate: 'desc' } }
      },
      attendance: {
        take: 30,
        orderBy: { date: "desc" }
      },
      marks: {
        include: { examination: true, subject: true },
        take: 5,
        orderBy: { createdAt: "desc" }
      }
    }
  });

  const activeEnrollment = student?.enrollments[0];
  
  const upcomingExams = activeEnrollment ? await prisma.examination.findMany({
    where: {
      academicSessionId: activeEnrollment.academicSessionId,
      isPublished: true,
      // Only show exams that haven't ended yet, or if endDate is null, fallback to all published
      OR: [
        { endDate: { gte: new Date() } },
        { endDate: null }
      ]
    },
    include: {
      examinationSubjects: {
        include: { subject: true },
        orderBy: { examDate: 'asc' }
      }
    },
    orderBy: { startDate: 'asc' },
    take: 3
  }) : [];

  if (!student || !student.profile) {
    return (
      <div className="flex-1 p-8 pt-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Profile Not Linked
            </CardTitle>
            <CardDescription>
              Your user account has not been linked to a student profile yet. Please contact administration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const className = activeEnrollment?.section?.class?.name || "N/A";
  const sectionName = activeEnrollment?.section?.name || "";
  const sessionName = activeEnrollment?.academicSession?.name || "N/A";

  // Calculate attendance percentage (basic logic over last 30 entries)
  const presentDays = student.attendance.filter(a => a.status === "PRESENT").length;
  const totalDays = student.attendance.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {student.profile.firstName} {student.profile.lastName}
        </h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enrollment No.
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student.enrollmentNumber}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {className}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Attendance
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on last {totalDays} records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Academic Session
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionName}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Status: {student.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Profile Setup
            </CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Complete</div>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {student.admissionNumber}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Marks & Grades</CardTitle>
            <CardDescription>
              Your latest academic performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.marks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No marks have been recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {student.marks.map(mark => (
                  <div key={mark.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{mark.subject.name}</p>
                      <p className="text-xs text-muted-foreground">{mark.examination.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{mark.isAbsent ? "ABS" : mark.grade}</p>
                      <p className="text-xs text-muted-foreground">
                        {mark.isAbsent ? "0" : mark.obtainedMarks} / {mark.maxMarks}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="link" className="px-0" asChild>
                  <Link href="/student/marks">View Full Report Card &rarr;</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>
              Your recent presence logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.attendance.length === 0 ? (
              <p className="text-muted-foreground text-sm">No attendance records found.</p>
            ) : (
              <div className="space-y-4">
                {student.attendance.slice(0, 5).map(att => (
                  <div key={att.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{new Date(att.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        att.status === "PRESENT" ? "bg-green-100 text-green-700" :
                        att.status === "ABSENT" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Button variant="link" className="px-0" asChild>
                  <Link href="/student/attendance">View Full Attendance &rarr;</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams Section */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
              Upcoming Examinations
            </CardTitle>
            <CardDescription>
              Your schedule for upcoming tests and exams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming examinations scheduled at this time.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcomingExams.map(exam => (
                  <div key={exam.id} className="border rounded-xl p-4 shadow-sm bg-card">
                    <div className="mb-4 border-b pb-3">
                      <h4 className="font-semibold text-lg">{exam.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'TBA'} 
                        {exam.endDate ? ` - ${new Date(exam.endDate).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    {exam.examinationSubjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">Subjects timetable not yet published.</p>
                    ) : (
                      <div className="space-y-3">
                        {exam.examinationSubjects.map(es => (
                          <div key={es.id} className="flex items-center justify-between text-sm">
                            <span className="font-medium">{es.subject.name}</span>
                            <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded-md">
                              {es.examDate ? new Date(es.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBA'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
