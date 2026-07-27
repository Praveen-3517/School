import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MarkEntryTable } from "@/components/marks/mark-entry-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marks Overview | Admin",
  description: "View and edit marks across all classes.",
};

interface AdminMarksPageProps {
  searchParams: Promise<{ examId?: string; sectionId?: string; subjectId?: string }>;
}

export default async function AdminMarksPage(props: AdminMarksPageProps) {
  const searchParams = await props.searchParams;
  await requireAdmin();

  const examinations = await prisma.examination.findMany({
    include: { examinationSubjects: true },
    orderBy: { createdAt: 'desc' }
  });

  const sections = await prisma.section.findMany({
    include: { class: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }]
  });

  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });

  const selectedExamId = searchParams.examId;
  const selectedSectionId = searchParams.sectionId;
  const selectedSubjectId = searchParams.subjectId;

  const selectedExam = examinations.find(e => e.id === selectedExamId);
  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  let examSubjectConfig = null;
  let students: any[] = [];
  let existingMarks: any[] = [];

  if (selectedExam && selectedSection && selectedSubject) {
    examSubjectConfig = selectedExam.examinationSubjects.find(
      es => es.subjectId === selectedSubject.id
    );

    if (examSubjectConfig) {
      // Find the current academic session (we'll just use the first active one or the exam's session)
      const session = await prisma.academicSession.findFirst({
        where: { id: selectedExam.academicSessionId }
      });

      if (session) {
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
          enrollmentNumber: e.student.enrollmentNumber
        }));

        existingMarks = await prisma.mark.findMany({
          where: {
            examinationId: selectedExam.id,
            subjectId: selectedSubject.id,
            studentId: { in: students.map(s => s.id) }
          }
        });
      }
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Marks Overview</h2>
        <p className="text-muted-foreground">Admin override and view of all examination marks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Step 1: Exam */}
        <Card>
          <CardHeader>
            <CardTitle>1. Examination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {examinations.map(exam => (
              <Link 
                key={exam.id} 
                href={`?examId=${exam.id}${selectedSectionId ? `&sectionId=${selectedSectionId}` : ''}${selectedSubjectId ? `&subjectId=${selectedSubjectId}` : ''}`}
                className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${selectedExamId === exam.id ? 'border-primary bg-primary/5' : ''}`}
              >
                {exam.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Step 2: Class/Section */}
        <Card>
          <CardHeader>
            <CardTitle>2. Class</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {sections.map(section => (
              <Link 
                key={section.id} 
                href={`?${selectedExamId ? `examId=${selectedExamId}&` : ''}sectionId=${section.id}${selectedSubjectId ? `&subjectId=${selectedSubjectId}` : ''}`}
                className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${selectedSectionId === section.id ? 'border-primary bg-primary/5' : ''}`}
              >
                {section.class.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Step 3: Subject */}
        <Card>
          <CardHeader>
            <CardTitle>3. Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
            {subjects.map(subject => (
              <Link 
                key={subject.id} 
                href={`?${selectedExamId ? `examId=${selectedExamId}&` : ''}${selectedSectionId ? `sectionId=${selectedSectionId}&` : ''}subjectId=${subject.id}`}
                className={`block p-2 rounded-md border text-sm transition-colors hover:bg-accent ${selectedSubjectId === subject.id ? 'border-primary bg-primary/5' : ''}`}
              >
                {subject.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {selectedExam && selectedSection && selectedSubject && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mark Entry Sheet (Admin)</CardTitle>
            <CardDescription>
              {selectedExam.name} | {selectedSubject.name} | {selectedSection.class.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!examSubjectConfig ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                This subject is not configured for the selected examination.
              </div>
            ) : (
              <MarkEntryTable 
                examinationId={selectedExam.id}
                subjectId={selectedSubject.id}
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
