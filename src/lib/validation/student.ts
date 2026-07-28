import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().optional().or(z.literal("")),
  lastName: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  bloodGroup: z.string().optional().or(z.literal("")),
  aadharNumber: z.string().optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  
  // Guardian Info
  guardianName: z.string().optional().or(z.literal("")),
  guardianRelation: z.string().optional().or(z.literal("")),
  guardianPhone: z.string().optional().or(z.literal("")),
  guardianEmail: z.string().optional().or(z.literal("")),
  
  // Academic Info
  admissionNumber: z.string().optional().or(z.literal("")),
  enrollmentNumber: z.string().optional().or(z.literal("")),
  admissionDate: z.string().optional().or(z.literal("")),
  sectionId: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "GRADUATED", "SUSPENDED", "WITHDRAWN"]).default("ACTIVE"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
