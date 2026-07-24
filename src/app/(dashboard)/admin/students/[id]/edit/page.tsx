import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { StudentForm } from "@/components/students/student-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Student | EduManage",
  description: "Update student records and information.",
};

interface EditStudentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage(props: EditStudentPageProps) {
  const params = await props.params;
  await requireAdmin();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      guardian: true,
      user: true,
      enrollments: {
        where: { isActive: true },
        take: 1
      }
    },
  });

  if (!student || !student.profile || !student.guardian) {
    notFound();
  }

  const initialData = {
    firstName: student.profile.firstName,
    lastName: student.profile.lastName,
    email: student.user.email,
    phone: student.user.phone || "",
    dateOfBirth: student.profile.dateOfBirth.toISOString().split('T')[0],
    bloodGroup: student.profile.bloodGroup || "",
    address: student.profile.address,
    guardianName: student.guardian.name,
    guardianRelation: student.guardian.relation,
    guardianPhone: student.guardian.phone,
    guardianEmail: student.guardian.email || "",
    admissionNumber: student.admissionNumber,
    enrollmentNumber: student.enrollmentNumber,
    admissionDate: student.admissionDate.toISOString().split('T')[0],
    sectionId: student.enrollments[0]?.sectionId || "",
    status: student.status as any,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/students/${student.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to profile</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Student</h2>
      </div>
      
      <div className="max-w-4xl">
        <StudentForm initialData={initialData} />
      </div>
    </div>
  );
}
