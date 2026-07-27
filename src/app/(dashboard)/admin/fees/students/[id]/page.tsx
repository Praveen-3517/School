import { requireRole } from "@/lib/auth/session";
import { prisma as db } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils/utils";
import { format } from "date-fns";
import { FeeCalculator } from "@/lib/services/fee-calculator";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentModal } from "@/components/fees/payment-modal";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export const metadata = {
  title: "Student Fee Profile | EduManage",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default async function StudentFeeProfilePage({ params }: PageProps) {
  await requireRole("ADMIN");

  const student = await db.student.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      enrollments: {
        where: { academicSession: { isCurrent: true } },
        include: { section: { include: { class: true } } }
      },
      studentFees: {
        include: {
          feeStructure: { include: { feeCategory: true } },
          payments: { where: { status: "SUCCESS" }, orderBy: { paymentDate: "desc" } },
          lateFees: { where: { status: "ACTIVE" } },
          discounts: true,
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!student) notFound();

  const enrollment = student.enrollments[0];

  // Calculate live statuses for each fee
  const enrichedFees = await Promise.all(
    student.studentFees.map(async (fee) => {
      const calc = await FeeCalculator.calculateStudentFee(fee.id);
      return {
        ...fee,
        calculation: calc
      };
    })
  );

  const totalOutstanding = enrichedFees.reduce((acc, fee) => acc + (fee.calculation?.outstandingBalance || 0), 0);
  const totalPaid = enrichedFees.reduce((acc, fee) => acc + (fee.calculation?.totalPaid || 0), 0);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Profile</h2>
          <p className="text-muted-foreground mt-1">
            {student.profile?.firstName} {student.profile?.lastName} ({student.enrollmentNumber})
          </p>
        </div>
        <Badge variant="outline" className="text-sm py-1 px-3">
          {enrollment ? `${enrollment.section.class.name}` : "Unassigned"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
               {formatCurrency(totalPaid)}
             </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
               {formatCurrency(totalOutstanding)}
             </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground">Account Status</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-center mt-2">
                {totalOutstanding === 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-3 py-1">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> All Cleared
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none px-3 py-1">
                    <Clock className="w-4 h-4 mr-1" /> Dues Pending
                  </Badge>
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Fees</CardTitle>
              <CardDescription>All fee structures assigned to this student.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {enrichedFees.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No fees assigned to this student.
                    </div>
                  ) : (
                    enrichedFees.map(fee => (
                      <div key={fee.id} className="border rounded-lg p-4 flex flex-col md:flex-row gap-4 justify-between bg-card hover:bg-muted/10 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{fee.feeStructure.name}</span>
                            {fee.calculation?.status === "PAID" && <Badge className="bg-emerald-100 text-emerald-800 border-none">Paid</Badge>}
                            {fee.calculation?.status === "UNPAID" && <Badge variant="secondary">Unpaid</Badge>}
                            {fee.calculation?.status === "PARTIAL" && <Badge variant="outline" className="text-amber-600 border-amber-200">Partial</Badge>}
                            {fee.calculation?.status === "OVERDUE" && <Badge className="bg-destructive hover:bg-destructive text-white">Overdue</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">Category: {fee.feeStructure.feeCategory.name}</p>
                          {fee.dueDate && (
                            <p className="text-sm text-muted-foreground">Due Date: {format(new Date(fee.dueDate), "MMM dd, yyyy")}</p>
                          )}
                          
                          <div className="pt-2 text-sm">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                               <span className="text-muted-foreground">Original:</span>
                               <span className="font-medium">{formatCurrency(fee.originalAmount)}</span>
                               
                               {(fee.calculation?.totalPayable || 0) > fee.originalAmount && (
                                 <>
                                   <span className="text-destructive">Late Fees:</span>
                                   <span className="text-destructive font-medium">
                                     +{formatCurrency((fee.calculation?.totalPayable || 0) - fee.originalAmount)}
                                   </span>
                                 </>
                               )}
                               
                               <span className="text-muted-foreground">Total Payable:</span>
                               <span className="font-bold">{formatCurrency(fee.calculation?.totalPayable || 0)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between min-w-[140px]">
                           <div className="text-right">
                             <p className="text-sm text-muted-foreground">Outstanding</p>
                             <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {formatCurrency(fee.calculation?.outstandingBalance || 0)}
                             </p>
                           </div>
                           
                           {fee.calculation && fee.calculation.outstandingBalance > 0 && (
                             <div className="mt-4 w-full">
                                <PaymentModal 
                                  studentId={student.id} 
                                  studentFeeId={fee.id} 
                                  outstandingBalance={fee.calculation.outstandingBalance}
                                  feeName={fee.feeStructure.name}
                                />
                             </div>
                           )}
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Recent Payments</CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {student.studentFees.flatMap(f => f.payments).length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No payments recorded yet.
                    </div>
                  ) : (
                    student.studentFees
                      .flatMap(f => f.payments.map(p => ({ ...p, feeName: f.feeStructure.name })))
                      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
                      .slice(0, 5)
                      .map(payment => (
                        <div key={payment.id} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-medium text-sm">{formatCurrency(payment.amount)}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[150px]">{payment.feeName}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{payment.receiptNumber}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-xs">{format(new Date(payment.paymentDate), "MMM dd")}</p>
                             <Badge variant="outline" className="mt-1 text-[10px] py-0">{payment.paymentMethod}</Badge>
                          </div>
                        </div>
                      ))
                  )}
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
