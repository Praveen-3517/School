// =============================================================================
// EduManage — Auth.js (NextAuth v5) Configuration
// =============================================================================

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import type { Role } from "@/types/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email / Username / Enrollment", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { identifier, password } = parsed.data;

        // Find user by email, username, or enrollment number
        const user = await prisma.user.findFirst({
          where: {
            isActive: true,
            OR: [
              { email: identifier.toLowerCase() },
              { username: identifier },
              {
                student: {
                  enrollmentNumber: identifier,
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            passwordHash: true,
            role: true,
            isActive: true,
            student: {
              select: { id: true, enrollmentNumber: true },
            },
            teacher: {
              select: { id: true, employeeId: true },
            },
          },
        });

        if (!user || !user.isActive) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          studentId: user.student?.id ?? null,
          teacherId: user.teacher?.id ?? null,
          enrollmentNumber: user.student?.enrollmentNumber ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
        token.studentId = (user as { studentId: string | null }).studentId;
        token.teacherId = (user as { teacherId: string | null }).teacherId;
        token.enrollmentNumber = (
          user as { enrollmentNumber: string | null }
        ).enrollmentNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.studentId = token.studentId as string | null;
        session.user.teacherId = token.teacherId as string | null;
        session.user.enrollmentNumber = token.enrollmentNumber as string | null;
      }
      return session;
    },
  },
  events: {
    async signOut() {
      // Could add audit logging here
    },
  },
  trustHost: true,
});
