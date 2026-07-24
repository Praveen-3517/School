import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ExaminationList } from "@/components/examinations/examination-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Examination Management | EduManage",
  description: "Create and manage academic examinations.",
};

export default async function ExaminationsPage() {
  await requireAdmin();

  const examinations = await prisma.examination.findMany({
    include: {
      academicSession: true,
      _count: {
        select: { examinationSubjects: true }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Examinations</h2>
        <div className="flex items-center space-x-2">
          <Button size="sm" asChild>
            <Link href="/admin/examinations/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Exam
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic Examinations</CardTitle>
          <CardDescription>
            Manage exam terms, visibility, and subject scoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExaminationList examinations={examinations} />
        </CardContent>
      </Card>
    </div>
  );
}
