import { z } from "zod";

export const teacherSchema = z.object({
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  
  employeeId: z.string().optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  designation: z.string().optional().or(z.literal("")),
  joinedAt: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
