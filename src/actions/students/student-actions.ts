"use server";

import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/audit-log";
import {
  createStudentSchema,
  updateStudentSchema,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import { generateEnrollmentNumber } from "@/lib/utils/utils";
import { revalidatePath } from "next/cache";
import type { StudentStatus } from "@/types/enums";

// =============================================================================
// CREATE STUDENT
// =============================================================================
export async function createStudentAction(data: CreateStudentInput) {
  const session = await requireAdmin();

  const validated = createStudentSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Invalid data provided.", details: validated.error.flatten() };
  }

  const {
    firstName,
    lastName,
    middleName,
    dateOfBirth,
    gender,
    bloodGroup,
    phone,
    email,
    address,
    city,
    state,
    postalCode,
    admissionNumber,
    admissionDate,
    sectionId,
    academicSessionId,
    rollNumber,
    password,
    fatherName,
    fatherPhone,
    fatherEmail,
    motherName,
    motherPhone,
    guardianName,
    guardianPhone,
    guardianEmail,
  } = validated.data;

  // Check admission number uniqueness
  const existingAdmission = await prisma.student.findUnique({
    where: { admissionNumber },
  });
  if (existingAdmission) {
    return { success: false, error: "A student with this admission number already exists." };
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: "A user with this email already exists." };
    }
  }

  const enrollmentNumber = generateEnrollmentNumber();
  const passwordHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email: email || `${enrollmentNumber.toLowerCase()}@edumanage.internal`,
          username: enrollmentNumber,
          passwordHash,
          role: "STUDENT",
          isActive: true,
        },
      });

      // Create student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          enrollmentNumber,
          admissionNumber,
          admissionDate: new Date(admissionDate),
          status: "ACTIVE",
        },
      });

      // Create student profile
      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          firstName,
          lastName,
          middleName: middleName ?? null,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          bloodGroup: bloodGroup ?? "UNKNOWN",
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          postalCode: postalCode || null,
        },
      });

      // Create guardian info
      await tx.guardianInfo.create({
        data: {
          studentId: student.id,
          fatherName: fatherName || null,
          fatherPhone: fatherPhone || null,
          fatherEmail: fatherEmail || null,
          motherName: motherName || null,
          motherPhone: motherPhone || null,
          guardianName: guardianName || null,
          guardianPhone: guardianPhone || null,
          guardianEmail: guardianEmail || null,
        },
      });

      // Create enrollment
      await tx.studentEnrollment.create({
        data: {
          studentId: student.id,
          sectionId,
          academicSessionId,
          rollNumber: rollNumber || null,
          isActive: true,
        },
      });

      return { user, student };
    });

    // Audit log
    await createAuditLog({
      actorUserId: session.user.id,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: result.student.id,
      newData: {
        enrollmentNumber,
        admissionNumber,
        name: `${firstName} ${lastName}`,
      },
    });

    revalidatePath("/admin/students");
    return {
      success: true,
      data: { studentId: result.student.id, enrollmentNumber },
    };
  } catch (error) {
    console.error("[createStudentAction]", error);
    return { success: false, error: "Failed to create student. Please try again." };
  }
}

// =============================================================================
// UPDATE STUDENT
// =============================================================================
export async function updateStudentAction(
  studentId: string,
  data: UpdateStudentInput
) {
  const session = await requireAdmin();

  const validated = updateStudentSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { profile: true },
  });
  if (!student) return { success: false, error: "Student not found." };

    try {
    const previousData = student.profile ?? {};

    await prisma.$transaction(async (tx) => {
      // Also update the core Student record's numbers
      await tx.student.update({
        where: { id: studentId },
        data: {
          enrollmentNumber: (data as any).enrollmentNumber || `__HIDDEN_ENR__${Date.now()}`,
          admissionNumber: (data as any).admissionNumber || `__HIDDEN_ADM__${Date.now()}`,
        }
      });

      if (student.profile) {
        await tx.studentProfile.update({
          where: { studentId },
          data: {
            firstName: validated.data.firstName,
            lastName: validated.data.lastName,
            middleName: validated.data.middleName,
            dateOfBirth: validated.data.dateOfBirth
              ? new Date(validated.data.dateOfBirth)
              : undefined,
            gender: validated.data.gender,
            bloodGroup: validated.data.bloodGroup,
            phone: validated.data.phone,
            address: validated.data.address,
            city: validated.data.city,
            state: validated.data.state,
            postalCode: validated.data.postalCode,
          },
        });
      }

      if (validated.data.fatherName !== undefined) {
        await tx.guardianInfo.update({
          where: { studentId },
          data: {
            fatherName: validated.data.fatherName,
            fatherPhone: validated.data.fatherPhone,
            fatherEmail: validated.data.fatherEmail,
            motherName: validated.data.motherName,
            motherPhone: validated.data.motherPhone,
            guardianName: validated.data.guardianName,
            guardianPhone: validated.data.guardianPhone,
            guardianEmail: validated.data.guardianEmail,
          },
        });
      }
    });

    await createAuditLog({
      actorUserId: session.user.id,
      action: "STUDENT_UPDATED",
      entityType: "Student",
      entityId: studentId,
      previousData: previousData as Record<string, unknown>,
      newData: validated.data as Record<string, unknown>,
    });

    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("[updateStudentAction]", error);
    return { success: false, error: "Failed to update student." };
  }
}

// =============================================================================
// DEACTIVATE / REACTIVATE STUDENT
// =============================================================================
export async function updateStudentStatusAction(
  studentId: string,
  status: StudentStatus
) {
  const session = await requireAdmin();

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return { success: false, error: "Student not found." };

  const previousStatus = student.status;

  await prisma.student.update({
    where: { id: studentId },
    data: { status },
  });

  // Also update user.isActive
  await prisma.user.update({
    where: { id: student.userId },
    data: { isActive: status === "ACTIVE" },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: status === "ACTIVE" ? "STUDENT_REACTIVATED" : "STUDENT_DEACTIVATED",
    entityType: "Student",
    entityId: studentId,
    previousData: { status: previousStatus },
    newData: { status },
  });

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  return { success: true };
}

// =============================================================================
// GET STUDENTS (with search, filter, pagination)
// =============================================================================
export async function getStudentsAction({
  query,
  sectionId,
  academicSessionId,
  status,
  page = 1,
  pageSize = 20,
}: {
  query?: string;
  sectionId?: string;
  academicSessionId?: string;
  status?: StudentStatus;
  page?: number;
  pageSize?: number;
}) {
  // This is called from Server Components — uses requireSession internally
  const session = await requireAdmin();

  const take = Math.min(pageSize, 100);
  const skip = (page - 1) * take;

  const where = {
    ...(status && { status }),
    ...(query
      ? {
          OR: [
            { enrollmentNumber: { contains: query, mode: "insensitive" as const } },
            { admissionNumber: { contains: query, mode: "insensitive" as const } },
            {
              profile: {
                OR: [
                  { firstName: { contains: query, mode: "insensitive" as const } },
                  { lastName: { contains: query, mode: "insensitive" as const } },
                ],
              },
            },
          ],
        }
      : {}),
    ...(academicSessionId || sectionId
      ? {
          enrollments: {
            some: {
              isActive: true,
              ...(academicSessionId && { academicSessionId }),
              ...(sectionId && { sectionId }),
            },
          },
        }
      : {}),
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        enrollmentNumber: true,
        admissionNumber: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
        enrollments: {
          where: { isActive: true },
          take: 1,
          select: {
            rollNumber: true,
            section: {
              select: {
                name: true,
                class: { select: { name: true } },
              },
            },
            academicSession: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  return {
    students,
    total,
    page,
    pageSize: take,
    totalPages: Math.ceil(total / take),
  };
}
