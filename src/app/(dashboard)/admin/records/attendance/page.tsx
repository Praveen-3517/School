import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Attendance Records | Admin",
  description: "View and override attendance records.",
};

interface AdminAttendancePageProps {
  searchParams: Promise<{ date?: string; sectionId?: string; subjectId?: string }>;
}

export default async function AdminAttendancePage(props: AdminAttendancePageProps) {
  const searchParams = await props.searchParams;
  await requireAdmin();

  // Determine selected date (default to today if not provided)
  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDateStr = searchParams.date || todayStr;
  const selectedDate = new Date(selectedDateStr);
  const isFutureDate = selectedDate > new Date();

  const sections = await prisma.section.findMany({
    include: { class: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }]
  });

  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });

  const selectedSectionId = searchParams.sectionId;
  const selectedSubjectId = searchParams.subjectId; // Can be empty for general attendance

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  let students: any[] = [];
  let existingRecords: any[] = [];
  let currentSessionId = "";

  if (selectedSection && !isFutureDate) {
    // Find the current active session
    const session = await prisma.academicSession.findFirst({
      where: { isCurrent: true }
    }) || await prisma.academicSession.findFirst();

    if (session) {
      currentSessionId = session.id;

      // Fetch students enrolled in this section
      const enrollments = await prisma.studentEnrollment.findMany({
        where: {
          sectionId: selectedSection.id,
          academicSessionId: session.id,
        },
        include: {
          student: { include: { user: true } }
        },
        orderBy: { rollNumber: 'asc' }
      });

      students = enrollments.map(e => ({
        id: e.studentId,
        name: e.student.user.name,
        enrollmentNo: e.student.enrollmentNumber
      }));

      // Fetch existing records
      existingRecords = await prisma.attendance.findMany({
        where: {
          sectionId: selectedSection.id,
          date: selectedDate,
          subjectId: selectedSubject ? selectedSubject.id : null,
          studentId: { in: students.map(s => s.id) }
        }
      });
    }
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
        <h2 className="text-3xl font-bold tracking-tight">System Attendance Overview</h2>
        <p className="text-muted-foreground">Administer attendance records across all classes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Step 1: Date */}
        <Card>
          <CardHeader>
            <CardTitle>1. Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {recentDates.map(ds => (
                <Link 
                  key={ds} 
                  href={`?date=${ds}${selectedSectionId ? `&sectionId=${selectedSectionId}` : ''}${selectedSubjectId ? `&subjectId=${selectedSubjectId}` : ''}`}
                >
                  <Badge variant={selectedDateStr === ds ? "default" : "outline"} className="text-sm py-1 px-3 cursor-pointer hover:bg-primary/80">
                    {ds === todayStr ? "Today" : format(new Date(ds), "MMM dd")}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Class/Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. Class & Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {sections.map(section => (
              <Link 
                key={section.id} 
                href={`?date=${selectedDateStr}&sectionId=${section.id}${selectedSubjectId ? `&subjectId=${selectedSubjectId}` : ''}`}
                className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${selectedSectionId === section.id ? 'border-primary bg-primary/5' : ''}`}
              >
                Class {section.class.name} - {section.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Step 3: Subject (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>3. Subject (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            <Link 
              href={`?date=${selectedDateStr}${selectedSectionId ? `&sectionId=${selectedSectionId}` : ''}`}
              className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${!selectedSubjectId ? 'border-primary bg-primary/5' : ''}`}
            >
              (Daily / Homeroom Attendance)
            </Link>
            {subjects.map(subject => (
              <Link 
                key={subject.id} 
                href={`?date=${selectedDateStr}${selectedSectionId ? `&sectionId=${selectedSectionId}` : ''}&subjectId=${subject.id}`}
                className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${selectedSubjectId === subject.id ? 'border-primary bg-primary/5' : ''}`}
              >
                {subject.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {isFutureDate && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20 mt-6">
          You cannot manage attendance for a future date.
        </div>
      )}

      {selectedSection && currentSessionId && !isFutureDate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Attendance Roster (Admin)</CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE, MMMM do, yyyy")} | Class {selectedSection.class.name} - {selectedSection.name} {selectedSubject ? `| ${selectedSubject.name}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTable 
              date={selectedDateStr}
              sectionId={selectedSection.id}
              subjectId={selectedSubject?.id}
              academicSessionId={currentSessionId}
              students={students}
              existingRecords={existingRecords}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
