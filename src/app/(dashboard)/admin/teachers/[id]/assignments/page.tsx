import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { TeacherAssignmentForm } from "@/components/teachers/teacher-assignment-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Teacher Assignments | EduManage",
  description: "Manage subject assignments for teachers.",
};

interface TeacherAssignmentsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherAssignmentsPage(props: TeacherAssignmentsPageProps) {
  const params = await props.params;
  await requireAdmin();

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      assignments: {
        include: {
          subject: true,
          section: {
            include: { class: true }
          },
          academicSession: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
  });

  if (!teacher) {
    notFound();
  }

  // Fetch all available subjects and sections for the dropdowns
  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' }
  });

  const sections = await prisma.section.findMany({
    select: { 
      id: true, 
      name: true,
      class: { select: { id: true, name: true } }
    },
    orderBy: [
      { class: { displayOrder: 'asc' } },
      { name: 'asc' }
    ]
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/teachers/${teacher.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to profile</span>
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Subject Assignments</h2>
          <p className="text-muted-foreground">Managing assignments for {teacher.user.name}</p>
        </div>
      </div>
      
      <div className="max-w-5xl">
        <TeacherAssignmentForm 
          teacherId={teacher.id}
          subjects={subjects}
          sections={sections}
          currentAssignments={teacher.assignments.map(a => ({
            id: a.id,
            academicSession: a.academicSession.name,
            subject: a.subject!,
            section: a.section!
          }))}
        />
      </div>
    </div>
  );
}
