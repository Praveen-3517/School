import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { StudentForm } from "@/components/students/student-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Add New Student | EduManage",
  description: "Register a new student in the system.",
};

export default async function NewStudentPage() {
  await requireAdmin();

  // Fetch sections with their classes for the dropdown
  const sections = await prisma.section.findMany({
    include: { class: true },
    orderBy: [
      { class: { displayOrder: 'asc' } },
      { name: 'asc' }
    ]
  });

  const formattedSections = sections.map(s => ({
    id: s.id,
    name: `${s.class.name} - ${s.name}`
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/students">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to students</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Add New Student</h2>
      </div>
      
      <div className="max-w-4xl">
        <StudentForm sections={formattedSections} />
      </div>
    </div>
  );
}
