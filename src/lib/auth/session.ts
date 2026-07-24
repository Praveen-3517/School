// =============================================================================
// EduManage — Session Utilities
// Server-side session helpers — NEVER expose to client bundles
// =============================================================================

import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import type { Role } from "@/types/enums";

export type AuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    studentId: string | null;
    teacherId: string | null;
    enrollmentNumber: string | null;
  };
};

/**
 * Get the current session — returns null if not authenticated.
 * Use in Server Components and Route Handlers.
 */
export async function getSession(): Promise<AuthSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session as AuthSession;
}

/**
 * Get the session or redirect to /login.
 * Throws redirect if not authenticated.
 */
export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Get the session and verify the user has the required role.
 * Redirects to /login if not authenticated, /unauthorized if wrong role.
 */
export async function requireRole(
  ...roles: Role[]
): Promise<AuthSession> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }
  return session;
}

/**
 * Verify the user is an Admin.
 */
export async function requireAdmin(): Promise<AuthSession> {
  return requireRole("ADMIN");
}

/**
 * Verify the user is a Teacher.
 */
export async function requireTeacher(): Promise<AuthSession> {
  return requireRole("TEACHER");
}

/**
 * Verify the user is a Student.
 */
export async function requireStudent(): Promise<AuthSession> {
  return requireRole("STUDENT");
}

/**
 * Verify the user is Admin or Teacher.
 */
export async function requireAdminOrTeacher(): Promise<AuthSession> {
  return requireRole("ADMIN", "TEACHER");
}
