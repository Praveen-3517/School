"use server";

import { prisma } from "@/lib/db/prisma";
import { batchAttendanceSchema, type BatchAttendanceValues } from "@/lib/validation/attendance";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function saveAttendanceBatch(data: BatchAttendanceValues) {
  try {
    const session = await requireSession();
    
    // Quick role check: Admin or Teacher only
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized access" };
    }

    const parsed = batchAttendanceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid attendance data provided" };
    }

    const { date, sectionId, subjectId, academicSessionId, records } = parsed.data;

    const targetDate = new Date(date);
    
    // Prevent future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (targetDate > today) {
      return { success: false, error: "Cannot mark attendance for a future date" };
    }

    let teacherId = null;
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });
      if (teacher) teacherId = teacher.id;
    }

    await prisma.$transaction(async (tx) => {
      for (const entry of records) {
        
        // Find existing attendance for this student on this date for this subject
        // Notice: `subjectId` can be null if it's daily homeroom attendance
        
        // The unique constraint is [studentId, date, subjectId] (where subjectId can be null, but Prisma handles nulls differently in unique constraints. However, we'll use findFirst).
        const existingAttendance = await tx.attendance.findFirst({
          where: {
            studentId: entry.studentId,
            date: targetDate,
            subjectId: subjectId || null,
          }
        });

        if (existingAttendance) {
          await tx.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              status: entry.status,
              remarks: entry.remarks || null,
              teacherId, // record who last updated it
            }
          });
        } else {
          await tx.attendance.create({
            data: {
              studentId: entry.studentId,
              sectionId,
              subjectId: subjectId || null,
              academicSessionId,
              teacherId,
              date: targetDate,
              status: entry.status,
              remarks: entry.remarks || null,
            }
          });
        }
      }
    });

    revalidatePath("/teacher/attendance");
    revalidatePath("/admin/records/attendance");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving attendance:", error);
    return { success: false, error: "Failed to save attendance" };
  }
}
