import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ExaminationForm } from "@/components/examinations/examination-form";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Create Examination | EduManage",
  description: "Define a new examination and its subject criteria.",
};

export default async function NewExaminationPage() {
  await requireAdmin();

  const subjects = await prisma.subject.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' }
  });

  const sessions = await prisma.academicSession.findMany({
    select: { id: true, name: true },
    orderBy: { startDate: 'desc' }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/examinations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to examinations</span>
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Create Examination</h2>
      </div>
      
      <div className="max-w-5xl">
        <ExaminationForm subjects={subjects} sessions={sessions} />
      </div>
    </div>
  );
}
