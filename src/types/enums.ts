// =============================================================================
// EduManage — Enums
// Migrated from Prisma schema since SQLite does not support enums in Prisma.
// =============================================================================

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

export type Permission = 
  | "STUDENT_VIEW"
  | "STUDENT_CREATE"
  | "STUDENT_UPDATE"
  | "STUDENT_DELETE"
  | "TEACHER_VIEW"
  | "TEACHER_CREATE"
  | "TEACHER_UPDATE"
  | "TEACHER_DELETE"
  | "MARK_VIEW"
  | "MARK_CREATE"
  | "MARK_UPDATE"
  | "MARK_DELETE"
  | "ATTENDANCE_VIEW"
  | "ATTENDANCE_CREATE"
  | "ATTENDANCE_UPDATE"
  | "ATTENDANCE_DELETE"
  | "CLASS_MANAGE"
  | "SECTION_MANAGE"
  | "SUBJECT_MANAGE"
  | "SESSION_MANAGE"
  | "EXAMINATION_MANAGE"
  | "REPORT_VIEW"
  | "REPORT_EXPORT"
  | "AUDIT_LOG_VIEW"
  | "SYSTEM_SETTINGS_MANAGE"
  | "DOCUMENT_VIEW"
  | "DOCUMENT_UPLOAD"
  | "DOCUMENT_DELETE"
  | "NOTIFICATION_MANAGE";

export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export type BloodGroup = 
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED" | "TRANSFERRED" | "SUSPENDED" | "DROPPED";

export type TeacherStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "RESIGNED";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export type Grade = "A_PLUS" | "A" | "B_PLUS" | "B" | "C_PLUS" | "C" | "D" | "E" | "F" | "NOT_GRADED";

export type AuditAction = 
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "PASSWORD_RESET"
  | "STUDENT_CREATED"
  | "STUDENT_UPDATED"
  | "STUDENT_DEACTIVATED"
  | "STUDENT_REACTIVATED"
  | "TEACHER_CREATED"
  | "TEACHER_UPDATED"
  | "TEACHER_DEACTIVATED"
  | "TEACHER_REACTIVATED"
  | "MARK_CREATED"
  | "MARK_UPDATED"
  | "ATTENDANCE_CREATED"
  | "ATTENDANCE_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "SETTINGS_UPDATED";

export type NotificationType = "SYSTEM" | "ACADEMIC" | "ATTENDANCE" | "FEE" | "EXAM";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type DocumentType = "PROFILE_PHOTO" | "IDENTITY_PROOF" | "PREVIOUS_ACADEMIC_RECORD" | "MEDICAL_RECORD" | "OTHER";
