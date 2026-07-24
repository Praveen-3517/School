// =============================================================================
// EduManage — NextAuth TypeScript Type Extensions
// Extends the default session and JWT types to include role, studentId, etc.
// =============================================================================

import type { DefaultSession, DefaultJWT } from "next-auth";
import type { Role } from "@/types/enums";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      studentId: string | null;
      teacherId: string | null;
      enrollmentNumber: string | null;
    };
  }

  interface User {
    id: string;
    role: Role;
    studentId: string | null;
    teacherId: string | null;
    enrollmentNumber: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    studentId: string | null;
    teacherId: string | null;
    enrollmentNumber: string | null;
  }
}
