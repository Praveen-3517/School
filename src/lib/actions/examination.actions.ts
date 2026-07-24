"use server";

import { prisma } from "@/lib/db/prisma";
import { examinationSchema, type ExaminationFormValues } from "@/lib/validation/examination";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function createExamination(data: ExaminationFormValues) {
  try {
    await requireAdmin();
    
    const parsed = examinationSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid form data" };
    }

    const {
      name, academicSessionId, startDate, endDate, description, isPublished, subjects
    } = parsed.data;

    // We must validate that passingMarks <= maxMarks for all subjects
    for (const sub of subjects) {
      if (sub.passingMarks > sub.maxMarks) {
        return { success: false, error: "Passing marks cannot exceed maximum marks." };
      }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Base Examination
      const exam = await tx.examination.create({
        data: {
          name,
          academicSessionId,
          description: description || null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          isPublished,
        },
      });

      // 2. Create Examination Subjects
      await tx.examinationSubject.createMany({
        data: subjects.map((sub) => ({
          examinationId: exam.id,
          subjectId: sub.subjectId,
          maxMarks: sub.maxMarks,
          passingMarks: sub.passingMarks,
          examDate: sub.examDate ? new Date(sub.examDate) : null,
        }))
      });
    });

    revalidatePath("/admin/examinations");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating examination:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Duplicate subject added to examination." };
    }
    return { success: false, error: error.message || "Failed to create examination" };
  }
}

export async function toggleExaminationPublish(id: string, currentStatus: boolean) {
  try {
    await requireAdmin();
    
    await prisma.examination.update({
      where: { id },
      data: { isPublished: !currentStatus },
    });

    revalidatePath("/admin/examinations");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling publish status:", error);
    return { success: false, error: "Failed to update examination status" };
  }
}

export async function deleteExamination(id: string) {
  try {
    await requireAdmin();
    
    await prisma.examination.delete({
      where: { id },
    });

    revalidatePath("/admin/examinations");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting examination:", error);
    return { success: false, error: "Failed to delete examination" };
  }
}
