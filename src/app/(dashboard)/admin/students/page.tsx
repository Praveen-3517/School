import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { StudentTable } from "@/components/students/student-table";
import { studentColumns } from "@/components/students/student-columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download } from "lucide-react";
import Link from "next/link";
import type { StudentStatus } from "@/types/enums";


export const metadata: Metadata = {
  title: "Student Management | EduManage",
  description: "Manage student records, admissions, and academic details.",
};

interface StudentsPageProps {
  searchParams: Promise<{
    query?: string;
    classId?: string;
    sectionId?: string;
    status?: StudentStatus;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  
  // Parse pagination
  const page = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  // Build the where clause for filtering
  const where: any = {};
  
  if (params.query) {
    where.OR = [
      { profile: { firstName: { contains: params.query } } },
      { profile: { lastName: { contains: params.query } } },
      { profile: { aadharNumber: { contains: params.query } } },
      { enrollmentNumber: { contains: params.query } },
      { admissionNumber: { contains: params.query } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  // Fetch paginated data
  const [totalCount, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            section: {
              include: { class: true }
            },
            academicSession: true,
          },
          take: 1, // Get only active enrollment
        },
        profile: true,
        user: {
          select: { email: true, isActive: true }
        }
      },
    }),
  ]);

  const pageCount = Math.ceil(totalCount / pageSize);

  // Map the Prisma data to our table shape
  const tableData = students.map((s) => {
    const activeEnrollment = s.enrollments[0];
    
    return {
      id: s.id,
      firstName: s.profile?.firstName || "Unknown",
      lastName: s.profile?.lastName || "",
      aadharNumber: s.profile?.aadharNumber || "N/A",
      admissionNumber: s.admissionNumber,
      status: s.status as StudentStatus,
      email: s.user?.email || "N/A",
      phone: s.profile?.phone || "N/A",
      className: activeEnrollment?.section?.class?.name || "Not Assigned",
      sectionName: activeEnrollment?.section?.name || "",
      academicSession: activeEnrollment?.academicSession?.name || "N/A",
      createdAt: s.createdAt,
    };
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Students</h2>
          <p className="text-muted-foreground mt-1">
            Manage student records, academic details, and enrollment status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/admin/students/new">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Add Student</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>
            Showing {students.length} of {totalCount} total students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentTable 
            columns={studentColumns} 
            data={tableData} 
            pageCount={pageCount}
            totalItems={totalCount}
          />
        </CardContent>
      </Card>
    </div>
  );
}
