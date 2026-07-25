import { z } from "zod";

export const teacherSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15).optional().or(z.literal("")),
  
  employeeId: z.string().min(3, "Employee ID is required"),
  department: z.string().min(2, "Department is required"),
  designation: z.string().min(2, "Designation is required"),
  joinedAt: z.string().refine((val) => {
    const d = new Date(val);
    const year = d.getFullYear();
    return !isNaN(d.getTime()) && year >= 1900 && year <= new Date().getFullYear() + 1;
  }, {
    message: "Invalid joining date. Year must be valid.",
  }),
  isActive: z.boolean().default(true),
});

export type TeacherFormValues = z.infer<typeof teacherSchema>;
