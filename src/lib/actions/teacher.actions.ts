"use server";

import { prisma } from "@/lib/db/prisma";
import { teacherSchema, type TeacherFormValues } from "@/lib/validation/teacher";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import type { Role } from "@/types/enums";

export async function createTeacher(data: TeacherFormValues) {
  try {
    const session = await requireAdmin();
    
    // Validate the input data
    const parsed = teacherSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid form data" };
    }

    // Assign fallback values
    const firstName = parsed.data.firstName || "Unknown";
    const lastName = parsed.data.lastName || "Teacher";
    const email = parsed.data.email || `teacher_${Date.now()}@school.local`;
    const phone = parsed.data.phone || null;
    const employeeId = parsed.data.employeeId || `EMP-${Date.now()}`;
    const department = parsed.data.department || "General";
    const designation = parsed.data.designation || "Teacher";
    const joinedAt = parsed.data.joinedAt ? new Date(parsed.data.joinedAt) : new Date();
    const isActive = parsed.data.isActive ?? true;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    // Default password is Employee ID or a standard default
    const defaultPassword = employeeId;
    const passwordHash = await hashPassword(defaultPassword);

    // Create User and Teacher in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`.trim(),
          email,
          passwordHash,
          role: "TEACHER" as Role,
          isActive,
        },
      });

      // 2. Create Teacher Profile
      await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          qualification: "", // Add default or modify form if needed
          specialization: department, // Map department to specialization or similar
          phone,
          joiningDate: joinedAt,
        },
      });
    });

    revalidatePath("/admin/teachers");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Employee ID already exists" };
    }
    return { success: false, error: error.message || "Failed to create teacher" };
  }
}

export async function assignTeacherToSubject(data: {
  teacherId: string;
  subjectId: string;
  sectionId: string;
  academicSession: string;
}) {
  try {
    await requireAdmin();
    
    // Check if assignment already exists
    const existing = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        sectionId: data.sectionId,
        academicSession: {
          name: data.academicSession || "2025-2026"
        }
      }
    });

    if (existing) {
      return { success: false, error: "Teacher is already assigned to this subject and section." };
    }

    // We need to fetch the academic session ID first
    const session = await prisma.academicSession.findUnique({
      where: { name: data.academicSession || "2025-2026" }
    });

    if (!session) {
      return { success: false, error: "Academic session not found" };
    }

    await prisma.teacherAssignment.create({
      data: {
        teacherId: data.teacherId,
        subjectId: data.subjectId,
        sectionId: data.sectionId,
        academicSessionId: session.id,
      }
    });

    revalidatePath(`/admin/teachers/${data.teacherId}`);
    revalidatePath(`/admin/teachers/${data.teacherId}/assignments`);
    return { success: true };
  } catch (error: any) {
    console.error("Error assigning subject:", error);
    return { success: false, error: "Failed to assign subject" };
  }
}

export async function removeTeacherAssignment(id: string, teacherId: string) {
  try {
    await requireAdmin();
    
    await prisma.teacherAssignment.delete({
      where: { id }
    });

    revalidatePath(`/admin/teachers/${teacherId}`);
    revalidatePath(`/admin/teachers/${teacherId}/assignments`);
    return { success: true };
  } catch (error: any) {
    console.error("Error removing assignment:", error);
    return { success: false, error: "Failed to remove assignment" };
  }
}

export async function updateTeacherPermissions(userId: string, permissions: string[]) {
  try {
    const session = await requireAdmin();
    
    // Start transaction to clear existing and set new permissions
    await prisma.$transaction(async (tx) => {
      // Clear old
      await tx.userPermission.deleteMany({
        where: { userId }
      });

      // Insert new
      if (permissions.length > 0) {
        await tx.userPermission.createMany({
          data: permissions.map(p => ({
            userId,
            permission: p,
            granted: true,
            grantedBy: session.user.id
          }))
        });
      }
    });

    revalidatePath(`/admin/teachers`); // assuming this updates anything dependent on teacher list
    return { success: true };
  } catch (error: any) {
    console.error("Error updating permissions:", error);
    return { success: false, error: "Failed to update permissions" };
  }
}

