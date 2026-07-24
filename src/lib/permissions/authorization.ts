// =============================================================================
// EduManage — Centralized Permission & Authorization Engine
// RBAC + Permission-based + Resource-level authorization
// All authorization logic is centralized here — never duplicate across routes
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import type { Permission, Role } from "@/types/enums";
import type { AuthSession } from "@/lib/auth/session";

// =============================================================================
// DEFAULT ROLE PERMISSIONS
// These are the baseline permissions for each role.
// Admins can grant/revoke additional permissions per user via UserPermission.
// =============================================================================

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "STUDENT_VIEW",
    "STUDENT_CREATE",
    "STUDENT_UPDATE",
    "STUDENT_DELETE",
    "TEACHER_VIEW",
    "TEACHER_CREATE",
    "TEACHER_UPDATE",
    "TEACHER_DELETE",
    "MARK_VIEW",
    "MARK_CREATE",
    "MARK_UPDATE",
    "MARK_DELETE",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_CREATE",
    "ATTENDANCE_UPDATE",
    "ATTENDANCE_DELETE",
    "CLASS_MANAGE",
    "SECTION_MANAGE",
    "SUBJECT_MANAGE",
    "SESSION_MANAGE",
    "EXAMINATION_MANAGE",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "AUDIT_LOG_VIEW",
    "SYSTEM_SETTINGS_MANAGE",
    "DOCUMENT_VIEW",
    "DOCUMENT_UPLOAD",
    "DOCUMENT_DELETE",
    "NOTIFICATION_MANAGE",
  ],
  TEACHER: [
    // Teachers get minimal defaults — Admin configures additional permissions
    "STUDENT_VIEW",
    "MARK_VIEW",
    "MARK_CREATE",
    "MARK_UPDATE",
    "ATTENDANCE_VIEW",
    "ATTENDANCE_CREATE",
    "ATTENDANCE_UPDATE",
    "REPORT_VIEW",
    "DOCUMENT_VIEW",
  ],
  STUDENT: [
    // Students have read-only access to their own data only
    "STUDENT_VIEW",
    "MARK_VIEW",
    "ATTENDANCE_VIEW",
    "REPORT_VIEW",
    "DOCUMENT_VIEW",
  ],
};

// =============================================================================
// PERMISSION CHECK FUNCTIONS
// =============================================================================

/**
 * Get all effective permissions for a user.
 * Merges role defaults with individual UserPermission overrides.
 */
export async function getUserPermissions(
  userId: string,
  role: Role
): Promise<Set<Permission>> {
  const permissions = new Set<Permission>(DEFAULT_ROLE_PERMISSIONS[role]);

  // Apply individual overrides
  const userPermissions = await prisma.userPermission.findMany({
    where: { userId },
  });

  for (const up of userPermissions) {
    if (up.granted) {
      permissions.add(up.permission as Permission);
    } else {
      // Explicitly revoked
      permissions.delete(up.permission as Permission);
    }
  }

  return permissions;
}

/**
 * Check if a user has a specific permission.
 */
export async function hasPermission(
  session: AuthSession,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(session.user.id, session.user.role);
  return permissions.has(permission);
}

/**
 * Check if a user has ALL of the listed permissions.
 */
export async function hasAllPermissions(
  session: AuthSession,
  permissions: Permission[]
): Promise<boolean> {
  const userPerms = await getUserPermissions(session.user.id, session.user.role);
  return permissions.every((p) => userPerms.has(p));
}

// =============================================================================
// RESOURCE-LEVEL AUTHORIZATION
// =============================================================================

/**
 * Check if the current user can access a specific student's data.
 *
 * Rules:
 * - ADMIN: always yes
 * - STUDENT: only their own record (derived from session, never from client input)
 * - TEACHER: only students in their assigned sections/classes in current session
 */
export async function canAccessStudent(
  session: AuthSession,
  studentId: string
): Promise<boolean> {
  const { role, id: userId, studentId: sessionStudentId } = session.user;

  if (role === "ADMIN") return true;

  if (role === "STUDENT") {
    // Students can ONLY access their own record
    // Identity comes from session — never trust client-supplied studentId
    return sessionStudentId === studentId;
  }

  if (role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!teacher) return false;

    // Get current session
    const currentSession = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    });
    if (!currentSession) return false;

    // Check if student is enrolled in any section this teacher is assigned to
    const teacherSectionIds = await prisma.teacherAssignment
      .findMany({
        where: {
          teacherId: teacher.id,
          academicSessionId: currentSession.id,
          sectionId: { not: null },
        },
        select: { sectionId: true },
      })
      .then((assignments) =>
        assignments.map((a) => a.sectionId).filter(Boolean) as string[]
      );

    if (teacherSectionIds.length === 0) return false;

    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        academicSessionId: currentSession.id,
        sectionId: { in: teacherSectionIds },
        isActive: true,
      },
    });

    return enrollment !== null;
  }

  return false;
}

/**
 * Check if the current user can modify a student's marks for a specific subject.
 *
 * Rules:
 * - ADMIN: always yes
 * - TEACHER: must be assigned to the subject AND have access to the student
 * - STUDENT: never
 */
export async function canModifyMarks(
  session: AuthSession,
  studentId: string,
  subjectId: string
): Promise<boolean> {
  if (session.user.role === "ADMIN") return true;
  if (session.user.role === "STUDENT") return false;

  // Teacher must have MARK_UPDATE permission
  const hasPerm = await hasPermission(session, "MARK_UPDATE");
  if (!hasPerm) return false;

  // Teacher must have access to the student
  const studentAccess = await canAccessStudent(session, studentId);
  if (!studentAccess) return false;

  // Teacher must be assigned to this subject
  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) return false;

  const currentSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  if (!currentSession) return false;

  const subjectAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      subjectId,
      academicSessionId: currentSession.id,
    },
  });

  return subjectAssignment !== null;
}

/**
 * Check if the current user can modify attendance for a student.
 *
 * Rules:
 * - ADMIN: always yes
 * - TEACHER: must be assigned to the section AND have ATTENDANCE_UPDATE permission
 * - STUDENT: never
 */
export async function canModifyAttendance(
  session: AuthSession,
  studentId: string,
  sectionId?: string
): Promise<boolean> {
  if (session.user.role === "ADMIN") return true;
  if (session.user.role === "STUDENT") return false;

  const hasPerm = await hasPermission(session, "ATTENDANCE_UPDATE");
  if (!hasPerm) return false;

  return canAccessStudent(session, studentId);
}

/**
 * Require the session to have a specific permission.
 * Returns the permission set if authorized, throws an error if not.
 */
export async function requirePermission(
  session: AuthSession,
  permission: Permission
): Promise<void> {
  const allowed = await hasPermission(session, permission);
  if (!allowed) {
    throw new AuthorizationError(
      `Permission denied: ${permission} is required.`
    );
  }
}

// =============================================================================
// AUTHORIZATION ERROR
// =============================================================================

export class AuthorizationError extends Error {
  constructor(message: string = "You are not authorized to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}
