import { z } from "zod";

export const attendanceRecordSchema = z.object({
  studentId: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY"]),
  remarks: z.string().optional(),
});

export const batchAttendanceSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().optional(), // Nullable if taking daily attendance rather than period-wise
  academicSessionId: z.string().min(1, "Academic session is required"),
  records: z.array(attendanceRecordSchema),
});

export type AttendanceRecordValues = z.infer<typeof attendanceRecordSchema>;
export type BatchAttendanceValues = z.infer<typeof batchAttendanceSchema>;
