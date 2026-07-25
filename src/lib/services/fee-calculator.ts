import { prisma as db } from "@/lib/db/prisma";

export type FeeStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

export interface FeeCalculationResult {
  totalPayable: number;
  totalPaid: number;
  outstandingBalance: number;
  status: FeeStatus;
}

export const FeeCalculator = {
  /**
   * Calculate the financial status of a StudentFee record.
   * This retrieves all associated payments, late fees, and discounts to determine the true balance.
   */
  async calculateStudentFee(studentFeeId: string): Promise<FeeCalculationResult | null> {
    const studentFee = await db.studentFee.findUnique({
      where: { id: studentFeeId },
      include: {
        payments: {
          where: { status: "SUCCESS" },
        },
        lateFees: {
          where: { status: "ACTIVE" },
        },
        discounts: true,
      },
    });

    if (!studentFee) return null;
    
    if (studentFee.status === "CANCELLED") {
      return {
        totalPayable: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        status: "CANCELLED"
      }
    }

    // 1. Calculate Active Late Fees
    let totalLateFees = 0;
    for (const lateFee of studentFee.lateFees) {
      if (lateFee.type === "FIXED" && lateFee.amount) {
        totalLateFees += lateFee.amount;
      } else if (lateFee.type === "PERCENTAGE" && lateFee.percentage) {
        totalLateFees += (studentFee.originalAmount * lateFee.percentage) / 100;
      }
    }

    // 2. Calculate Total Discounts
    const totalDiscounts = studentFee.discounts.reduce((sum: number, discount: any) => sum + discount.amount, 0) + studentFee.discountAmount;

    // 3. Calculate Total Paid
    const totalPaid = studentFee.payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);

    // 4. Final Totals
    // Payable = Original Amount + Late Fees - Discounts (floor to 0 just in case)
    let totalPayable = Math.max(0, studentFee.originalAmount + totalLateFees - totalDiscounts);
    
    // Outstanding = Payable - Paid
    const outstandingBalance = Math.max(0, totalPayable - totalPaid);

    // 5. Determine New Status
    let status: FeeStatus = "UNPAID";
    
    if (outstandingBalance === 0 && totalPayable > 0) {
      status = "PAID";
    } else if (outstandingBalance === 0 && totalPayable === 0 && totalPaid > 0) {
      status = "PAID"; 
    } else if (outstandingBalance === 0 && totalPayable === 0 && totalPaid === 0) {
       // if it's completely waived
       status = "PAID";
    } else if (totalPaid > 0 && outstandingBalance > 0) {
      status = "PARTIAL";
    } else if (totalPaid === 0 && outstandingBalance > 0) {
      status = "UNPAID";
    }

    // Check Overdue if still UNPAID or PARTIAL
    if ((status === "UNPAID" || status === "PARTIAL") && studentFee.dueDate) {
      const now = new Date();
      if (studentFee.dueDate < now) {
        status = "OVERDUE";
      }
    }

    return {
      totalPayable,
      totalPaid,
      outstandingBalance,
      status,
    };
  },

  /**
   * Recalculates and updates the status of a StudentFee in the database.
   */
  async syncStudentFeeStatus(studentFeeId: string) {
    const calc = await this.calculateStudentFee(studentFeeId);
    if (!calc) return;
    
    await db.studentFee.update({
      where: { id: studentFeeId },
      data: { status: calc.status }
    });
    
    return calc;
  }
};
