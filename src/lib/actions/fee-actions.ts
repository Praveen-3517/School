"use server";

import { z } from "zod";
import { prisma as db } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import {
  feeStructureSchema,
  feePaymentSchema,
  lateFeeSchema,
  feeDiscountSchema,
} from "@/lib/validation/fee";
import { logAuditEvent } from "@/lib/audit";
import { FeeCalculator } from "@/lib/services/fee-calculator";

// -----------------------------------------------------------------------------
// FEE STRUCTURES
// -----------------------------------------------------------------------------

export async function createFeeStructure(
  data: z.infer<typeof feeStructureSchema>
) {
  try {
    const session = await requireRole("ADMIN");
    const validatedData = feeStructureSchema.parse(data);

    const feeStructure = await db.feeStructure.create({
      data: {
        ...validatedData,
        createdById: session.user.id,
      },
    });

    await logAuditEvent({
      action: "CREATE",
      entityType: "FeeStructure",
      entityId: feeStructure.id,
      newData: feeStructure,
      metadata: { description: "Created new fee structure" }
    });

    revalidatePath("/admin/fees/structures");
    return { success: true, data: feeStructure };
  } catch (error: any) {
    console.error("Failed to create fee structure:", error);
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// STUDENT FEES
// -----------------------------------------------------------------------------

export async function assignFeeToStudent(
  studentId: string,
  feeStructureId: string,
  academicSessionId: string
) {
  try {
    const session = await requireRole("ADMIN");

    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      throw new Error("Fee structure not found");
    }

    // Check if already assigned
    const existing = await db.studentFee.findFirst({
      where: { studentId, feeStructureId, academicSessionId },
    });

    if (existing) {
      return { success: false, error: "Fee is already assigned to this student" };
    }

    const studentFee = await db.studentFee.create({
      data: {
        studentId,
        feeStructureId,
        academicSessionId,
        originalAmount: feeStructure.amount,
        dueDate: feeStructure.dueDate,
        status: "UNPAID",
      },
    });

    await FeeCalculator.syncStudentFeeStatus(studentFee.id);

    await logAuditEvent({
      action: "CREATE",
      entityType: "StudentFee",
      entityId: studentFee.id,
      newData: studentFee,
      metadata: { description: "Assigned fee to student" }
    });

    revalidatePath(`/admin/fees/students/${studentId}`);
    return { success: true, data: studentFee };
  } catch (error: any) {
    console.error("Failed to assign fee to student:", error);
    return { success: false, error: error.message };
  }
}

export async function assignFeeToClass(
  classId: string,
  feeStructureId: string,
  academicSessionId: string
) {
  try {
    const session = await requireRole("ADMIN");

    const feeStructure = await db.feeStructure.findUnique({
      where: { id: feeStructureId },
    });

    if (!feeStructure) {
      throw new Error("Fee structure not found");
    }

    // Find all active students in the class/session
    const enrollments = await db.studentEnrollment.findMany({
      where: { section: { classId }, academicSessionId },
      include: { student: true },
    });

    let assignedCount = 0;

    // We do this sequentially or in a transaction. To avoid locking, we'll do sequential.
    for (const enrollment of enrollments) {
      const studentId = enrollment.studentId;
      
      const existing = await db.studentFee.findFirst({
        where: { studentId, feeStructureId, academicSessionId },
      });

      if (!existing) {
        await db.studentFee.create({
          data: {
            studentId,
            feeStructureId,
            academicSessionId,
            originalAmount: feeStructure.amount,
            dueDate: feeStructure.dueDate,
            status: "UNPAID",
          },
        });
        assignedCount++;
      }
    }

    await logAuditEvent({
      action: "CREATE",
      entityType: "StudentFee",
      entityId: `class-${classId}`,
      newData: { count: assignedCount, feeStructureId },
      metadata: { description: "Bulk assigned fee to class" }
    });

    revalidatePath(`/admin/fees`);
    revalidatePath(`/admin/fees/structures`);
    return { success: true, assignedCount };
  } catch (error: any) {
    console.error("Failed to assign fee to class:", error);
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// PAYMENTS
// -----------------------------------------------------------------------------

export async function recordPayment(data: z.infer<typeof feePaymentSchema>) {
  try {
    const session = await requireRole("ADMIN");
    const validatedData = feePaymentSchema.parse(data);

    // Verify fee exists and calculate amounts
    const feeStatus = await FeeCalculator.calculateStudentFee(validatedData.studentFeeId);
    
    if (!feeStatus) {
      throw new Error("Student fee not found");
    }

    if (feeStatus.outstandingBalance <= 0) {
      throw new Error("This fee is already fully paid");
    }

    if (validatedData.amount > feeStatus.outstandingBalance) {
      throw new Error(`Payment amount cannot exceed outstanding balance of ₹${feeStatus.outstandingBalance}`);
    }

    // Generate unique receipt number (e.g. REC-20260725-ABCD)
    const receiptNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Transaction to ensure atomicity
    const paymentResult = await db.$transaction(async (tx: any) => {
      const payment = await tx.feePayment.create({
        data: {
          ...validatedData,
          receiptNumber,
          receivedById: session.user.id,
        },
      });

      return payment;
    });

    // Sync status outside transaction to use our calculator service
    await FeeCalculator.syncStudentFeeStatus(validatedData.studentFeeId);

    await logAuditEvent({
      action: "CREATE",
      entityType: "FeePayment",
      entityId: paymentResult.id,
      newData: paymentResult,
      metadata: { description: "Recorded fee payment" }
    });

    revalidatePath(`/admin/fees/students/${validatedData.studentId}`);
    return { success: true, data: paymentResult };
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    return { success: false, error: error.message };
  }
}

// -----------------------------------------------------------------------------
// LATE FEES & DISCOUNTS
// -----------------------------------------------------------------------------

export async function applyLateFee(data: z.infer<typeof lateFeeSchema>) {
  try {
    const session = await requireRole("ADMIN");
    const validatedData = lateFeeSchema.parse(data);

    const lateFee = await db.lateFee.create({
      data: {
        ...validatedData,
      },
    });

    await FeeCalculator.syncStudentFeeStatus(validatedData.studentFeeId);

    await logAuditEvent({
      action: "CREATE",
      entityType: "LateFee",
      entityId: lateFee.id,
      newData: lateFee,
      metadata: { description: "Applied late fee" }
    });

    revalidatePath(`/admin/fees/students/${validatedData.studentId}`);
    return { success: true, data: lateFee };
  } catch (error: any) {
    console.error("Failed to apply late fee:", error);
    return { success: false, error: error.message };
  }
}

export async function waiveLateFee(lateFeeId: string, waiverReason: string) {
  try {
    const session = await requireRole("ADMIN");

    const existing = await db.lateFee.findUnique({ where: { id: lateFeeId } });
    if (!existing) throw new Error("Late fee not found");

    const lateFee = await db.lateFee.update({
      where: { id: lateFeeId },
      data: {
        status: "WAIVED",
        waivedById: session.user.id,
        waivedAt: new Date(),
        waiverReason,
      },
    });

    await FeeCalculator.syncStudentFeeStatus(lateFee.studentFeeId);

    await logAuditEvent({
      action: "UPDATE",
      entityType: "LateFee",
      entityId: lateFee.id,
      previousData: existing,
      newData: lateFee,
      metadata: { description: "Waived late fee" }
    });

    revalidatePath(`/admin/fees/students/${lateFee.studentId}`);
    return { success: true, data: lateFee };
  } catch (error: any) {
    console.error("Failed to waive late fee:", error);
    return { success: false, error: error.message };
  }
}

export async function applyDiscount(data: z.infer<typeof feeDiscountSchema>) {
  try {
    const session = await requireRole("ADMIN");
    const validatedData = feeDiscountSchema.parse(data);

    const feeStatus = await FeeCalculator.calculateStudentFee(validatedData.studentFeeId);
    if (!feeStatus) throw new Error("Student fee not found");
    
    if (validatedData.amount > feeStatus.totalPayable) {
       throw new Error(`Discount amount cannot exceed total payable amount of ₹${feeStatus.totalPayable}`);
    }

    const discount = await db.feeDiscount.create({
      data: {
        ...validatedData,
        approvedById: session.user.id,
      },
    });

    await FeeCalculator.syncStudentFeeStatus(validatedData.studentFeeId);

    await logAuditEvent({
      action: "CREATE",
      entityType: "FeeDiscount",
      entityId: discount.id,
      newData: discount,
      metadata: { description: "Applied fee discount" }
    });

    revalidatePath(`/admin/fees/students/${validatedData.studentId}`);
    return { success: true, data: discount };
  } catch (error: any) {
    console.error("Failed to apply discount:", error);
    return { success: false, error: error.message };
  }
}
