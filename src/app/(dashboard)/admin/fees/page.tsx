import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import { IndianRupee, TrendingUp, AlertCircle, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/utils";

export const metadata = {
  title: "Fees Dashboard | EduManage",
};

export default async function FeesDashboardPage() {
  await requireRole("ADMIN");

  // Get active session
  const activeSession = await db.academicSession.findFirst({
    where: { isCurrent: true },
  });

  if (!activeSession) {
    return <div className="p-6">No active academic session found.</div>;
  }

  // 1. Total Collected (Payments for the current session)
  const paymentsAgg = await db.feePayment.aggregate({
    where: { 
      status: "SUCCESS",
      studentFee: { academicSessionId: activeSession.id } 
    },
    _sum: { amount: true },
  });
  const totalCollected = paymentsAgg._sum.amount || 0;

  // 2. Expected Fees (All student fees original amounts)
  const studentFees = await db.studentFee.findMany({
    where: { academicSessionId: activeSession.id },
    select: { originalAmount: true, discountAmount: true, status: true }
  });

  let totalExpected = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const fee of studentFees) {
    const expectedForThis = Math.max(0, fee.originalAmount - fee.discountAmount);
    totalExpected += expectedForThis;
  }
  
  totalOutstanding = Math.max(0, totalExpected - totalCollected);
  
  // 3. Overdue approximation (for dashboard only, relying on the status field which is synced)
  const overdueFees = await db.studentFee.findMany({
    where: { academicSessionId: activeSession.id, status: "OVERDUE" },
    include: { payments: { where: { status: "SUCCESS" } } }
  });
  
  for (const fee of overdueFees) {
    const paid = fee.payments.reduce((acc, p) => acc + p.amount, 0);
    const expected = Math.max(0, fee.originalAmount - fee.discountAmount);
    totalOverdue += Math.max(0, expected - paid);
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fees & Finance</h2>
          <p className="text-muted-foreground mt-1">
            Financial overview for {activeSession.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expected
            </CardTitle>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(totalExpected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After discounts, excluding late fees
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collected
            </CardTitle>
            <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : 0}% of expected
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding Balance
            </CardTitle>
            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalOutstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending collections
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Amount
            </CardTitle>
            <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fees past their due date
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
             <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
             Dashboard charts will be implemented in the Reports section.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <CardTitle>Fee Collection by Category</CardTitle>
          </CardHeader>
          <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
             Dashboard charts will be implemented in the Reports section.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
