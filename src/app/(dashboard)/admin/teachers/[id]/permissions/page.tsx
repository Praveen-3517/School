import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { TeacherPermissionsForm } from "@/components/teachers/teacher-permissions-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Permission } from "@/types/enums";

export const metadata: Metadata = {
  title: "Teacher Permissions | EduManage",
  description: "Manage system access and permissions for teachers.",
};

interface TeacherPermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherPermissionsPage(props: TeacherPermissionsPageProps) {
  const params = await props.params;
  await requireAdmin();

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      user: {
        include: {
          userPermissions: true
        }
      }
    },
  });

  if (!teacher) {
    notFound();
  }

  const currentPermissions = teacher.user.userPermissions
    .filter(p => p.granted)
    .map(p => p.permission);

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
          <h2 className="text-3xl font-bold tracking-tight">Access Control</h2>
          <p className="text-muted-foreground">Configuring permissions for {teacher.user.name}</p>
        </div>
      </div>
      
      <div className="max-w-3xl">
        <TeacherPermissionsForm 
          userId={teacher.userId}
          initialPermissions={currentPermissions as Permission[]}
        />
      </div>
    </div>
  );
}
