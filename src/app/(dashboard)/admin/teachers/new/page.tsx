import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { TeacherForm } from "@/components/teachers/teacher-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Add New Teacher | EduManage",
  description: "Register a new teacher in the system.",
};

export default async function NewTeacherPage() {
  await requireAdmin();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/teachers">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to teachers</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Add New Teacher</h2>
      </div>
      
      <div className="max-w-4xl">
        <TeacherForm />
      </div>
    </div>
  );
}
