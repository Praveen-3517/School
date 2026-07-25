import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/utils/utils";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Fee Reports | EduManage",
};

export default async function FeeReportsPage() {
  await requireRole("ADMIN");

  const payments = await db.feePayment.findMany({
    where: { status: "SUCCESS" },
    include: {
      student: { include: { profile: true } },
      studentFee: { include: { feeStructure: true } }
    },
    orderBy: { paymentDate: "desc" },
    take: 100 // Limit for MVP
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fee Reports</h2>
          <p className="text-muted-foreground mt-1">
            Transaction history and collection reports.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 100 successful fee payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt No.</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Fee Description</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.receiptNumber}</td>
                      <td className="px-4 py-3">{format(new Date(p.paymentDate), "MMM dd, yyyy HH:mm")}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{p.student.profile?.firstName} {p.student.profile?.lastName}</span>
                          <span className="text-xs text-muted-foreground">{p.student.enrollmentNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{p.studentFee.feeStructure.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{p.paymentMethod}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
