import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MarkEntryTable } from "@/components/marks/mark-entry-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Mark Entry | EduManage",
  description: "Enter examination marks for your classes.",
};

interface TeacherMarksPageProps {
  searchParams: Promise<{ examId?: string; assignmentId?: string }>;
}

export default async function TeacherMarksPage(props: TeacherMarksPageProps) {
  const searchParams = await props.searchParams;
  const session = await requireSession();

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 1. Get the teacher's profile and assignments
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

  // 2. Get Published Examinations for the active session(s) of this teacher
  // To keep it simple, we fetch all published exams
  const examinations = await prisma.examination.findMany({
    where: { isPublished: true },
    include: { examinationSubjects: true },
    orderBy: { createdAt: 'desc' }
  });

  const selectedExamId = searchParams.examId;
  const selectedAssignmentId = searchParams.assignmentId;

  const selectedExam = examinations.find(e => e.id === selectedExamId);
  const selectedAssignment = teacher.assignments.find(a => a.id === selectedAssignmentId);

  // If both are selected, we check if the selected exam has this subject configured
  let examSubjectConfig = null;
  let students: any[] = [];
  let existingMarks: any[] = [];

  if (selectedExam && selectedAssignment && selectedAssignment.subjectId && selectedAssignment.sectionId) {
    examSubjectConfig = selectedExam.examinationSubjects.find(
      es => es.subjectId === selectedAssignment.subjectId
    );

    if (examSubjectConfig) {
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
        orderBy: {
          rollNumber: 'asc'
        }
      });

      students = enrollments.map(e => ({
        id: e.studentId,
        name: e.student.user.name,
        enrollmentNo: e.student.enrollmentNumber
      }));

      // Fetch existing marks
      existingMarks = await prisma.mark.findMany({
        where: {
          examinationId: selectedExam.id,
          subjectId: selectedAssignment.subjectId!,
          studentId: { in: students.map(s => s.id) }
        }
      });
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Marks Entry</h2>
        <p className="text-muted-foreground">Select an examination and a class to enter marks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1. Select Examination</CardTitle>
            <CardDescription>Choose a published examination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {examinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published examinations available.</p>
            ) : (
              examinations.map(exam => (
                <Link 
                  key={exam.id} 
                  href={`?examId=${exam.id}${selectedAssignmentId ? `&assignmentId=${selectedAssignmentId}` : ''}`}
                  className={`block p-3 rounded-md border transition-colors hover:bg-accent ${selectedExamId === exam.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div className="font-medium">{exam.name}</div>
                  <div className="text-xs text-muted-foreground">{exam.examinationSubjects.length} subjects configured</div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Select Class & Subject</CardTitle>
            <CardDescription>Choose from your assigned classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {teacher.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">You have no assigned classes.</p>
            ) : (
              teacher.assignments.map(assignment => (
                <Link 
                  key={assignment.id} 
                  href={`?${selectedExamId ? `examId=${selectedExamId}&` : ''}assignmentId=${assignment.id}`}
                  className={`flex justify-between items-center p-3 rounded-md border transition-colors hover:bg-accent ${selectedAssignmentId === assignment.id ? 'border-primary bg-primary/5' : ''}`}
                >
                  <div>
                    <div className="font-medium">{assignment.subject?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Class {assignment.section?.class.name} - {assignment.section?.name}
                    </div>
                  </div>
                  <Badge variant="outline">{assignment.academicSession.name}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {selectedExam && selectedAssignment && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mark Entry Sheet</CardTitle>
            <CardDescription>
              {selectedExam.name} | {selectedAssignment.subject?.name} | Class {selectedAssignment.section?.class.name} - {selectedAssignment.section?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!examSubjectConfig ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                This subject is not configured for the selected examination. Please contact the administrator.
              </div>
            ) : (
              <MarkEntryTable 
                examinationId={selectedExam.id}
                subjectId={selectedAssignment.subjectId!}
                maxMarks={examSubjectConfig.maxMarks}
                students={students}
                existingMarks={existingMarks}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
