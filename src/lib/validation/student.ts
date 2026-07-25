import { z } from "zod";

export const studentSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15).optional().or(z.literal("")),
  dateOfBirth: z.string().refine((val) => {
    const d = new Date(val);
    const year = d.getFullYear();
    return !isNaN(d.getTime()) && year >= 1900 && year <= new Date().getFullYear();
  }, {
    message: "Invalid date of birth. Year must be valid.",
  }),
  bloodGroup: z.string().optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters").max(255),
  
  // Guardian Info
  guardianName: z.string().min(2, "Guardian name is required").max(100),
  guardianRelation: z.string().min(2, "Relation is required").max(50),
  guardianPhone: z.string().min(10, "Guardian phone must be at least 10 digits").max(15),
  guardianEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  
  // Academic Info
  admissionNumber: z.string().min(3, "Admission number is required"),
  enrollmentNumber: z.string().min(3, "Enrollment number is required"),
  admissionDate: z.string().refine((val) => {
    const d = new Date(val);
    const year = d.getFullYear();
    return !isNaN(d.getTime()) && year >= 1900 && year <= new Date().getFullYear() + 1;
  }, {
    message: "Invalid admission date. Year must be valid.",
  }),
  sectionId: z.string().min(1, "Class/Section is required"),
  status: z.enum(["ACTIVE", "GRADUATED", "SUSPENDED", "WITHDRAWN"]).default("ACTIVE"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
