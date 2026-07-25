// =============================================================================
// EduManage — General Utilities
// =============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

/**
 * Merge Tailwind CSS classes safely.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string.
 */
export function formatDate(
  date: Date | string | null | undefined,
  pattern: string = "dd MMM yyyy"
): string {
  if (!date) return "—";
  try {
    return format(new Date(date), pattern);
  } catch {
    return "Invalid date";
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "—";
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return "—";
  }
}

/**
 * Calculate grade from percentage.
 */
export function calculateGrade(
  obtainedMarks: number,
  maxMarks: number
): { grade: string; percentage: number } {
  if (maxMarks <= 0) return { grade: "NOT_GRADED", percentage: 0 };
  const percentage = (obtainedMarks / maxMarks) * 100;
  const rounded = Math.round(percentage * 100) / 100;

  let grade: string;
  if (percentage >= 90) grade = "A_PLUS";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B_PLUS";
  else if (percentage >= 60) grade = "B";
  else if (percentage >= 50) grade = "C_PLUS";
  else if (percentage >= 40) grade = "C";
  else if (percentage >= 33) grade = "D";
  else grade = "F";

  return { grade, percentage: rounded };
}

/**
 * Format file size from bytes to human-readable.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Generate a random enrollment number.
 * Format: ENR-YYYY-XXXXXX
 */
export function generateEnrollmentNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ENR-${year}-${random}`;
}

/**
 * Create a consistent API error response.
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400
): Response {
  return Response.json(
    { success: false, error: message },
    { status: statusCode }
  );
}

/**
 * Create a consistent API success response.
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): Response {
  return Response.json({ success: true, data }, { status: statusCode });
}

/**
 * Parse pagination params from URL search params.
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(10, parseInt(searchParams.get("pageSize") ?? "20"))
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

/**
 * Get the grade display label.
 */
export function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    A_PLUS: "A+",
    A: "A",
    B_PLUS: "B+",
    B: "B",
    C_PLUS: "C+",
    C: "C",
    D: "D",
    F: "F",
    NOT_GRADED: "—",
  };
  return labels[grade] ?? grade;
}

/**
 * Format number to Indian Rupee currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safe JSON parse — returns null on failure.
 */
export function safeJsonParse<T>(str: string): T | null {
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}
