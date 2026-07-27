"use server";

import { prisma } from "@/lib/db/prisma";
import { studentSchema, type StudentFormValues } from "@/lib/validation/student";
import { requireAdmin } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/types/enums";
import { v4 as uuidv4 } from "uuid";

export async function createStudent(data: StudentFormValues) {
  try {
    const session = await requireAdmin();
    
    const parsed = studentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid form data" };
    }

    // Assign fallback values for missing optional fields
    const firstName = parsed.data.firstName || "Unknown";
    const lastName = parsed.data.lastName || "Student";
    const email = parsed.data.email || `student_${Date.now()}@school.local`;
    const phone = parsed.data.phone || null;
    const dateOfBirth = parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : new Date("2010-01-01");
    const bloodGroup = parsed.data.bloodGroup || "UNKNOWN";
    const address = parsed.data.address || "Address not provided";
    
    const guardianName = parsed.data.guardianName || "Not Provided";
    const guardianRelation = parsed.data.guardianRelation || "Parent";
    const guardianPhone = parsed.data.guardianPhone || "0000000000";
    const guardianEmail = parsed.data.guardianEmail || null;
    
    const admissionNumber = parsed.data.admissionNumber || `ADM-${Date.now()}`;
    const enrollmentNumber = parsed.data.enrollmentNumber || `ENR-${Date.now()}`;
    const admissionDate = parsed.data.admissionDate ? new Date(parsed.data.admissionDate) : new Date();
    const sectionId = parsed.data.sectionId || null;
    const status = parsed.data.status || "ACTIVE";

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    const defaultPassword = enrollmentNumber;
    const passwordHash = await hashPassword(defaultPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          passwordHash,
          role: "STUDENT" as Role,
        },
      });

      // 2. Create Student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          enrollmentNumber,
          admissionNumber,
          admissionDate,
          status,
        },
      });

      // 3. Create Student Profile
      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          firstName,
          lastName,
          dateOfBirth,
          gender: "PREFER_NOT_TO_SAY",
          bloodGroup,
          phone,
          address,
        },
      });

      // 4. Create Guardian Info
      await tx.guardianInfo.create({
        data: {
          studentId: student.id,
          guardianName,
          relationship: guardianRelation,
          guardianPhone,
          guardianEmail,
        },
      });

      // 5. Enroll in section if provided
      if (sectionId) {
        let academicSession = await tx.academicSession.findFirst({
          where: { isCurrent: true }
        });

        if (!academicSession) {
          academicSession = await tx.academicSession.findFirst({
            orderBy: { startDate: 'desc' }
          });
        }

        if (academicSession) {
          await tx.studentEnrollment.create({
            data: {
              studentId: student.id,
              sectionId,
              academicSessionId: academicSession.id,
              isActive: true,
            },
          });
        }
      }
    });

    await logAuditEvent({
      action: "CREATE",
      entityType: "Student",
      newData: { enrollmentNumber, admissionNumber, firstName, lastName, email },
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Enrollment number or Admission number already exists" };
    }
    return { success: false, error: error.message || "Failed to create student" };
  }
}
