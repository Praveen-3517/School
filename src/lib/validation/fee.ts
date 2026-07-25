import * as z from "zod";

export const feeCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const feeStructureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  academicSessionId: z.string().min(1, "Academic session is required."),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  feeCategoryId: z.string().min(1, "Fee category is required."),
  amount: z.coerce.number().min(0, "Amount cannot be negative."),
  frequency: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]).default("ONE_TIME"),
  dueDate: z.date().optional().nullable(),
  isMandatory: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const studentFeeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required."),
  feeStructureId: z.string().min(1, "Fee Structure ID is required."),
  academicSessionId: z.string().min(1, "Academic Session ID is required."),
  originalAmount: z.coerce.number().min(0, "Amount cannot be negative."),
  discountAmount: z.coerce.number().min(0, "Discount cannot be negative.").default(0),
  dueDate: z.date().optional().nullable(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).default("UNPAID"),
});

export const feePaymentSchema = z.object({
  studentFeeId: z.string().min(1, "Student Fee ID is required."),
  studentId: z.string().min(1, "Student ID is required."),
  amount: z.coerce.number().min(1, "Payment amount must be greater than 0."),
  paymentDate: z.date().default(() => new Date()),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "ONLINE", "UPI", "CHEQUE", "OTHER"]),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
});

export const lateFeeSchema = z.object({
  studentFeeId: z.string().min(1, "Student Fee ID is required."),
  studentId: z.string().min(1, "Student ID is required."),
  type: z.enum(["FIXED", "PERCENTAGE"]),
  amount: z.coerce.number().optional(),
  percentage: z.coerce.number().optional(),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if (data.type === "FIXED" && (data.amount === undefined || data.amount <= 0)) {
      return false;
    }
    if (data.type === "PERCENTAGE" && (data.percentage === undefined || data.percentage <= 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Either amount or percentage must be provided and greater than 0 depending on the type.",
    path: ["amount"],
  }
);

export const feeDiscountSchema = z.object({
  studentFeeId: z.string().min(1, "Student Fee ID is required."),
  studentId: z.string().min(1, "Student ID is required."),
  amount: z.coerce.number().min(1, "Discount amount must be greater than 0."),
  reason: z.string().min(3, "Reason must be provided."),
});
