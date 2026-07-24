import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Edit Teacher | EduManage",
  description: "Update teacher records and information.",
};

interface EditTeacherPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeacherPage(props: EditTeacherPageProps) {
  const params = await props.params;
  await requireAdmin();

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      user: true,
    },
  });

  if (!teacher) {
    notFound();
  }

  // Splitting name to fit first/last format
  const nameParts = teacher.user.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const initialData = {
    firstName,
    lastName,
    email: teacher.user.email,
    phone: teacher.phone || "",
    employeeId: teacher.employeeId,
    department: teacher.specialization || "General",
    designation: "Teacher",
    joinedAt: teacher.joiningDate ? teacher.joiningDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    isActive: teacher.user.isActive,
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/teachers/${teacher.id}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to profile</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Teacher</h2>
      </div>
      
      <div className="max-w-4xl">
        <TeacherForm initialData={initialData} />
      </div>
    </div>
  );
}
