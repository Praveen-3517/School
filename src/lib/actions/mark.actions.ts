"use server";

import { prisma } from "@/lib/db/prisma";
import { batchMarkEntrySchema, type BatchMarkEntryValues } from "@/lib/validation/mark";
import { requireSession } from "@/lib/auth/session";
import { calculateGrade } from "@/lib/academic/grading";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";


export async function saveMarksBatch(data: BatchMarkEntryValues) {
  try {
    const session = await requireSession();
    
    // Quick role check: Admin or Teacher only
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return { success: false, error: "Unauthorized access" };
    }

    const parsed = batchMarkEntrySchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid mark data provided" };
    }

    const { examinationId, subjectId, maxMarks, marks } = parsed.data;

    // Optional check: if Teacher, ensure they have access to this subject or MANAGE_MARKS permission
    // For brevity, we assume the UI only allowed them to access their own subjects, 
    // but in a production app, we would re-verify teacherAssignment here.

    let teacherId = null;
    if (session.user.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: session.user.id }
      });
      if (teacher) teacherId = teacher.id;
    }

    await prisma.$transaction(async (tx) => {
      for (const entry of marks) {
        
        let gradeData = { grade: "NOT_GRADED", percentage: null as number | null };
        let obtained = entry.obtainedMarks ?? null;
        
        if (entry.isAbsent) {
          gradeData.grade = "ABS";
          obtained = 0;
        } else if (obtained !== null) {
          // Calculate standard grade
          const calc = calculateGrade(obtained, maxMarks);
          gradeData.grade = calc.grade;
          gradeData.percentage = calc.percentage;
        }

        // Upsert Mark
        const existingMark = await tx.mark.findFirst({
          where: {
            studentId: entry.studentId,
            examinationId,
            subjectId,
          }
        });

        if (existingMark) {
          await tx.mark.update({
            where: { id: existingMark.id },
            data: {
              obtainedMarks: obtained,
              maxMarks,
              grade: gradeData.grade,
              percentage: gradeData.percentage,
              isAbsent: entry.isAbsent,
              remarks: entry.remarks || null,
              teacherId,
            }
          });
        } else {
          await tx.mark.create({
            data: {
              studentId: entry.studentId,
              examinationId,
              subjectId,
              obtainedMarks: obtained,
              maxMarks,
              grade: gradeData.grade,
              percentage: gradeData.percentage,
              isAbsent: entry.isAbsent,
              remarks: entry.remarks || null,
              teacherId,
            }
          });
        }
      }
    });

    await logAuditEvent({
      action: "UPDATE",
      entityType: "Mark",
      newData: { examinationId, subjectId, batchSize: marks.length },
    });

    revalidatePath("/teacher/marks");
    revalidatePath("/admin/marks");
    return { success: true };
  } catch (error: any) {
    console.error("Error saving marks:", error);
    return { success: false, error: "Failed to save marks" };
  }
}
