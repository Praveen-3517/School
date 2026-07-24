import { z } from "zod";

export const examinationSubjectSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  maxMarks: z.coerce.number().min(1, "Max marks must be greater than 0"),
  passingMarks: z.coerce.number().min(0, "Passing marks must be valid"),
  examDate: z.string().optional().or(z.literal("")),
});

export const examinationSchema = z.object({
  name: z.string().min(3, "Exam name must be at least 3 characters").max(100),
  academicSessionId: z.string().min(1, "Academic session is required"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }).optional().or(z.literal("")),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
  subjects: z.array(examinationSubjectSchema).min(1, "At least one subject must be added to the exam"),
});

export type ExaminationFormValues = z.infer<typeof examinationSchema>;
export type ExaminationSubjectValues = z.infer<typeof examinationSubjectSchema>;
