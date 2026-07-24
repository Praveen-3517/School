import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TeacherTable } from "@/components/teachers/teacher-table";
import { teacherColumns, type TeacherTableType } from "@/components/teachers/teacher-columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Teacher Management | EduManage",
  description: "Manage teachers, roles, and subject assignments.",
};

interface TeachersPageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
    pageSize?: string;
  }>;
}

export default async function TeachersPage(props: TeachersPageProps) {
  const searchParams = await props.searchParams;
  await requireAdmin();

  // Pagination config
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  // Search filter
  const query = searchParams.query || "";

  const whereClause = query
    ? {
        OR: [
          { employeeId: { contains: query } },
          { user: { name: { contains: query } } },
        ],
      }
    : {};

  // Fetch total items for pagination math
  const totalItems = await prisma.teacher.count({
    where: whereClause,
  });

  // Fetch teachers with their user accounts
  const teachers = await prisma.teacher.findMany({
    where: whereClause,
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: pageSize,
  });

  const pageCount = Math.ceil(totalItems / pageSize);

  // Map database model to flat table model
  const formattedData: TeacherTableType[] = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.user.name,
    email: teacher.user.email,
    phone: teacher.phone,
    employeeId: teacher.employeeId,
    department: teacher.specialization || "General",
    designation: "Teacher",
    isActive: teacher.user.isActive,
    joinedAt: teacher.joiningDate || new Date(),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">Teacher Management</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/teachers/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Teacher
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Staff</CardTitle>
          <CardDescription>
            Manage teacher profiles and access credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherTable 
            columns={teacherColumns} 
            data={formattedData} 
            pageCount={pageCount}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>
    </div>
  );
}
