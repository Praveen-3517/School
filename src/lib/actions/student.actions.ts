"use server";

import { prisma } from "@/lib/db/prisma";
import { studentSchema, type StudentFormValues } from "@/lib/validation/student";
import { requireAdmin } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import type { Role } from "@/types/enums";

export async function createStudent(data: StudentFormValues) {
  try {
    const session = await requireAdmin();
    
    // Validate the input data
    const parsed = studentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid form data" };
    }

    const {
      firstName, lastName, email, phone, dateOfBirth, bloodGroup, address,
      guardianName, guardianRelation, guardianPhone, guardianEmail,
      admissionNumber, enrollmentNumber, admissionDate, sectionId, status
    } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return { success: false, error: "User with this email already exists" };
    }

    // Default password is Enrollment Number or a standard default
    const defaultPassword = enrollmentNumber;
    const passwordHash = await hash(defaultPassword, {
      memoryCost: 65536,
      timeCost: 3,
      outputLen: 32,
      parallelism: 1,
    });

    // Create User, Student, GuardianInfo, Profile, and initial Enrollment in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create Base User
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          passwordHash,
          role: "STUDENT" as Role,
          phone: phone || null,
        },
      });

      // 2. Create Student record
      const student = await tx.student.create({
        data: {
          userId: user.id,
          enrollmentNumber,
          admissionNumber,
          admissionDate: new Date(admissionDate),
          status,
        },
      });

      // 3. Create Student Profile
      await tx.studentProfile.create({
        data: {
          studentId: student.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          bloodGroup: bloodGroup || null,
          address,
        },
      });

      // 4. Create Guardian Info
      await tx.guardianInfo.create({
        data: {
          studentId: student.id,
          name: guardianName,
          relation: guardianRelation,
          phone: guardianPhone,
          email: guardianEmail || null,
        },
      });

      // 5. Enroll in section
      // Get academic session (assuming active one, or fetching from section)
      const section = await tx.section.findUnique({
        where: { id: sectionId },
        include: { class: true }
      });
      
      if (!section) throw new Error("Section not found");

      await tx.studentEnrollment.create({
        data: {
          studentId: student.id,
          sectionId,
          academicSession: "2025-2026", // In a real app, fetch active session
          isActive: true,
        },
      });
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
