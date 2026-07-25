import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/types/enums";

export const authConfig = {
  providers: [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
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
} satisfies NextAuthConfig;
