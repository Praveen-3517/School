// =============================================================================
// EduManage — Zod Validation Schemas
// =============================================================================

import { z } from "zod";

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email, username or enrollment number is required")
    .max(255),
  password: z.string().min(1, "Password is required").max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and a number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// =============================================================================
// STUDENT SCHEMAS
// =============================================================================

export const createStudentSchema = z.object({
  // Personal info
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  middleName: z.string().max(100).optional(),
  dateOfBirth: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please enter a valid date of birth",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]),
  bloodGroup: z
    .enum([
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
      "UNKNOWN",
    ])
    .default("UNKNOWN"),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(10).optional(),

  // Admission info
  admissionNumber: z.string().min(1, "Admission number is required").max(50),
  admissionDate: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please enter a valid admission date",
  }),
  sectionId: z.string().min(1, "Class/Section is required"),
  academicSessionId: z.string().min(1, "Academic session is required"),
  rollNumber: z.string().max(20).optional(),

  // Auth
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),

  // Guardian info (optional)
  fatherName: z.string().max(200).optional(),
  fatherPhone: z.string().max(20).optional(),
  fatherEmail: z.string().email().optional().or(z.literal("")),
  motherName: z.string().max(200).optional(),
  motherPhone: z.string().max(20).optional(),
  guardianName: z.string().max(200).optional(),
  guardianPhone: z.string().max(20).optional(),
  guardianEmail: z.string().email().optional().or(z.literal("")),
});

export const updateStudentSchema = createStudentSchema
  .omit({ password: true, admissionNumber: true })
  .partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// =============================================================================
// TEACHER SCHEMAS
// =============================================================================

export const createTeacherSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  employeeId: z.string().min(1, "Employee ID is required").max(50),
  qualification: z.string().max(500).optional(),
  specialization: z.string().max(500).optional(),
  phone: z
    .string()
    .regex(/^[+]?[\d\s\-()]{7,15}$/, "Invalid phone number")
    .optional()
    .or(z.literal("")),
  joiningDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), {
      message: "Please enter a valid joining date",
    })
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const updateTeacherSchema = createTeacherSchema
  .omit({ password: true, email: true })
  .partial();

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

// =============================================================================
// MARK SCHEMAS
// =============================================================================

export const createMarkSchema = z
  .object({
    studentId: z.string().min(1),
    examinationId: z.string().min(1),
    subjectId: z.string().min(1),
    maxMarks: z.number().positive("Maximum marks must be positive"),
    obtainedMarks: z.number().min(0, "Marks cannot be negative").optional(),
    isAbsent: z.boolean().default(false),
    remarks: z.string().max(1000).optional(),
  })
  .refine(
    (d) => {
      if (!d.isAbsent && d.obtainedMarks !== undefined) {
        return d.obtainedMarks <= d.maxMarks;
      }
      return true;
    },
    {
      message: "Obtained marks cannot exceed maximum marks",
      path: ["obtainedMarks"],
    }
  );

export const updateMarkSchema = createMarkSchema
  .omit({ studentId: true, examinationId: true, subjectId: true })
  .partial();

export type CreateMarkInput = z.infer<typeof createMarkSchema>;
export type UpdateMarkInput = z.infer<typeof updateMarkSchema>;

// =============================================================================
// ATTENDANCE SCHEMAS
// =============================================================================

export const createAttendanceSchema = z.object({
  studentId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  academicSessionId: z.string().min(1),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Please enter a valid date",
  }),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
  remarks: z.string().max(500).optional(),
});

export const bulkAttendanceSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d))),
  sectionId: z.string().min(1),
  academicSessionId: z.string().min(1),
  subjectId: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      remarks: z.string().max(500).optional(),
    })
  ),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;

// =============================================================================
// ACADEMIC STRUCTURE SCHEMAS
// =============================================================================

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  displayOrder: z.number().int().min(0).default(0),
  description: z.string().max(500).optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(10),
  classId: z.string().min(1, "Class is required"),
  capacity: z.number().int().positive().default(40),
  description: z.string().max(500).optional(),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(200),
  code: z.string().min(1, "Subject code is required").max(20),
  description: z.string().max(500).optional(),
  isElective: z.boolean().default(false),
});

export const createAcademicSessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(50),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d))),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d))),
  isCurrent: z.boolean().default(false),
});

// =============================================================================
// TEACHER ASSIGNMENT SCHEMAS
// =============================================================================

export const createTeacherAssignmentSchema = z.object({
  teacherId: z.string().min(1),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  academicSessionId: z.string().min(1),
  isClassTeacher: z.boolean().default(false),
});

// =============================================================================
// EXAMINATION SCHEMAS
// =============================================================================

export const createExaminationSchema = z.object({
  name: z.string().min(1, "Examination name is required").max(200),
  academicSessionId: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().max(1000).optional(),
});

// =============================================================================
// SEARCH & FILTER SCHEMAS
// =============================================================================

export const studentSearchSchema = z.object({
  query: z.string().max(200).optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  academicSessionId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "GRADUATED", "TRANSFERRED", "SUSPENDED", "DROPPED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.enum(["10", "20", "50", "100"]).default("20"),
  sortBy: z.enum(["name", "enrollmentNumber", "admissionDate", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type StudentSearchParams = z.infer<typeof studentSearchSchema>;
