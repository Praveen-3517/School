import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils/utils";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata = {
  title: "Fee Structures | EduManage",
};

export default async function FeeStructuresPage() {
  await requireRole("ADMIN");

  const structures = await db.feeStructure.findMany({
    include: {
      academicSession: true,
      class: true,
      feeCategory: true,
      _count: {
        select: { studentFees: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Structures</h2>
          <p className="text-muted-foreground mt-1">
            Manage fee templates and rules
          </p>
        </div>
        <Link href="/admin/fees/structures/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Structure
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Fee Structures</CardTitle>
          <CardDescription>A list of all fee configurations in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          {structures.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No fee structures found. Click "New Structure" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Class / Session</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Freq / Due Date</th>
                    <th className="px-4 py-3 font-medium">Assignments</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {structures.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{s.feeCategory.name}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{s.class ? s.class.name : "Global (All Classes)"}</span>
                          <span className="text-xs text-muted-foreground">{s.academicSession.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {formatCurrency(s.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span>{s.frequency.replace("_", " ")}</span>
                          {s.dueDate && (
                            <span className="text-xs text-muted-foreground">Due: {format(new Date(s.dueDate), "MMM dd, yyyy")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-muted-foreground">{s._count.studentFees} students</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none dark:bg-emerald-900/50 dark:text-emerald-400">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
