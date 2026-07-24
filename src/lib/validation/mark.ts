import { z } from "zod";

export const markEntrySchema = z.object({
  studentId: z.string(),
  obtainedMarks: z.coerce.number().min(0).optional(),
  isAbsent: z.boolean().default(false),
  remarks: z.string().optional(),
});

export const batchMarkEntrySchema = z.object({
  examinationId: z.string().min(1, "Examination is required"),
  subjectId: z.string().min(1, "Subject is required"),
  maxMarks: z.coerce.number().min(1),
  marks: z.array(markEntrySchema),
});

export type MarkEntryValues = z.infer<typeof markEntrySchema>;
export type BatchMarkEntryValues = z.infer<typeof batchMarkEntrySchema>;
