import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Eye, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Student Fee Management | EduManage",
};

export default async function StudentFeesPage() {
  await requireRole("ADMIN");

  // For a production app, this would be paginated and filtered via URL params.
  // We're keeping it simple for the MVP overview.
  const students = await db.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      profile: true,
      enrollments: {
        where: { academicSession: { isCurrent: true } },
        include: { section: { include: { class: true } } }
      },
      studentFees: {
        where: { academicSession: { isCurrent: true } }
      }
    },
    orderBy: { enrollmentNumber: "asc" },
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Fee Management</h2>
          <p className="text-muted-foreground mt-1">
            Search and manage financial profiles for students.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
               <CardTitle>Active Students</CardTitle>
               <CardDescription>Select a student to view or manage their fees.</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search students..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Enrollment No.</th>
                  <th className="px-4 py-3 font-medium">Student Name</th>
                  <th className="px-4 py-3 font-medium">Class</th>
                  <th className="px-4 py-3 font-medium">Current Fees Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => {
                  const enrollment = student.enrollments[0];
                  
                  // Calculate overall status badge
                  const hasOverdue = student.studentFees.some(f => f.status === "OVERDUE");
                  const hasUnpaid = student.studentFees.some(f => f.status === "UNPAID" || f.status === "PARTIAL");
                  const feeCount = student.studentFees.length;
                  
                  let statusBadge = <Badge variant="outline">No Fees Assigned</Badge>;
                  if (feeCount > 0) {
                    if (hasOverdue) {
                      statusBadge = <Badge className="bg-destructive hover:bg-destructive">Overdue</Badge>;
                    } else if (hasUnpaid) {
                      statusBadge = <Badge variant="secondary" className="text-amber-600 bg-amber-100 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400">Pending</Badge>;
                    } else {
                      statusBadge = <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none dark:bg-emerald-900/50 dark:text-emerald-400">All Clear</Badge>;
                    }
                  }

                  return (
                    <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{student.enrollmentNumber}</td>
                      <td className="px-4 py-3">
                        {student.profile?.firstName} {student.profile?.lastName}
                      </td>
                      <td className="px-4 py-3">
                        {enrollment 
                          ? `${enrollment.section.class.name}`
                          : "Unassigned"}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/fees/students/${student.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <IndianRupee className="h-4 w-4 text-emerald-600" />
                            <span className="sr-only">Manage Fees</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
