"use server";

import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Get student enrollment count grouped by class and section.
 */
export async function getEnrollmentStats() {
  await requireAdmin();

  // Find current academic session
  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true }
  });

  if (!activeSession) return [];

  // Get all active enrollments for the current session, joined with Class and Section
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      academicSessionId: activeSession.id,
      isActive: true,
    },
    include: {
      section: {
        include: {
          class: true,
        }
      }
    }
  });

  // Aggregate by Class Name
  const classMap = new Map<string, number>();

  enrollments.forEach(enc => {
    const className = enc.section.class.name;
    classMap.set(className, (classMap.get(className) || 0) + 1);
  });

  return Array.from(classMap.entries())
    .map(([className, count]) => ({
      name: className,
      students: count
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get average performance (percentage) per subject across the school.
 */
export async function getPerformanceStats() {
  await requireAdmin();

  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true }
  });

  if (!activeSession) return [];

  const marks = await prisma.mark.findMany({
    where: {
      examination: {
        academicSessionId: activeSession.id
      }
    },
    include: {
      subject: true
    }
  });

  const subjectMap = new Map<string, { totalPct: number; count: number }>();

  marks.forEach(m => {
    if (m.percentage !== null) {
      const subjName = m.subject.name;
      const current = subjectMap.get(subjName) || { totalPct: 0, count: 0 };
      current.totalPct += m.percentage;
      current.count += 1;
      subjectMap.set(subjName, current);
    }
  });

  return Array.from(subjectMap.entries())
    .map(([subj, data]) => ({
      subject: subj,
      average: Math.round(data.totalPct / data.count)
    }))
    // Take top 10 subjects by name for chart readability
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .slice(0, 10);
}

/**
 * Get attendance trend over the last 14 days (or less if no data).
 */
export async function getAttendanceTrend() {
  await requireAdmin();

  const activeSession = await prisma.academicSession.findFirst({
    where: { isCurrent: true }
  });

  if (!activeSession) return [];

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      academicSessionId: activeSession.id,
      date: {
        gte: fourteenDaysAgo
      }
    },
    select: {
      date: true,
      status: true
    }
  });

  // Group by date (YYYY-MM-DD)
  const dayMap = new Map<string, { present: number; total: number }>();

  attendanceRecords.forEach(record => {
    // Format date as string
    const dateStr = record.date.toISOString().split('T')[0];
    const current = dayMap.get(dateStr) || { present: 0, total: 0 };
    
    current.total += 1;
    if (record.status === "PRESENT" || record.status === "LATE") {
      current.present += 1;
    }
    
    dayMap.set(dateStr, current);
  });

  return Array.from(dayMap.entries())
    .map(([dateStr, data]) => {
      // Calculate percentage
      const rate = data.total > 0 ? (data.present / data.total) * 100 : 0;
      return {
        date: dateStr,
        rate: Math.round(rate),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
