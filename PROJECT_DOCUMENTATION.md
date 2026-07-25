# EduManage - Project Documentation

## 1. Project Overview
**EduManage** is a modern, full-stack School Management System designed to digitize and streamline administrative, academic, and student-facing operations. It provides a comprehensive platform for administrators, teachers, and students to manage enrollments, attendance, examinations, grades, and overall school administration.

---

## 2. Technology Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma ORM)
- **Styling**: Tailwind CSS & `shadcn/ui` components
- **Icons**: Lucide React
- **Validation**: Zod
- **Authentication**: Custom JWT/Cookie-based Role-Based Access Control (RBAC)
- **Deployment**: Vercel

---

## 3. Architecture & Directory Structure
The project follows a scalable Next.js App Router structure with clearly separated concerns.

```text
edumanage-temp/
├── prisma/
│   └── schema.prisma           # Database schema & migrations
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── admin/          # Admin portal routes
│   │   │   ├── student/        # Student portal routes
│   │   │   └── teacher/        # Teacher portal routes
│   │   ├── api/                # Next.js API Routes (if any)
│   │   ├── login/              # Public login page
│   │   └── layout.tsx          # Root layout (TopLoader, Toaster, global styles)
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Shadcn/ui core components
│   │   ├── admin/              # Admin-specific components (Sidebar, Charts)
│   │   ├── forms/              # Reusable form components
│   │   └── shared/             # Shared components across roles
│   ├── lib/                    # Core utilities and business logic
│   │   ├── auth/               # Authentication, Session management, JWT logic
│   │   ├── db/                 # Prisma client instance
│   │   ├── validation/         # Zod schemas for form validation
│   │   └── utils/              # Helper functions (date formatting, etc.)
│   └── middleware.ts           # Edge middleware for route protection & redirects
└── brain.md                    # Developer decisions log & history
```

---

## 4. Comprehensive Feature List

### Admin Portal (`/admin`)
- **Dashboard Hub**: Interactive summary cards (Total Students, Teachers, Classes, Subjects) with recent attendance charts and recent activity audit logs.
- **Student Management**: Add, edit, view, search, and manage student profiles, guardian information, and academic enrollments.
- **Teacher Management**: Onboard new teachers, manage assignments, and view teacher profiles.
- **Academic Structure**:
  - Manage **Academic Sessions** (e.g., 2025-2026).
  - Manage **Classes & Sections** (e.g., Class 9, Section A).
  - Manage **Subjects** (e.g., Mathematics, Science).
- **Examination Management**: Create exams, assign subjects, set maximum/passing marks, and schedule exam dates.
- **Attendance & Records**: View overall attendance trends and audit logs of system activity.
- **Settings**: System configurations.

### Student Portal (`/student`)
- **Student Dashboard**: Overview of enrollment status, recent attendance percentage, active academic session, and profile completion.
- **Upcoming Examinations**: Dynamic widget showing scheduled exams and subject-wise timetables.
- **Recent Marks & Grades**: View recent academic performance across subjects.
- **Attendance Logs**: View day-by-day attendance history (Present, Absent, Late).

### Teacher Portal (`/teacher`)
- **Teacher Dashboard**: Overview of assigned classes, subjects, and recent activity.
- **Mark Entry**: Enter marks and grades for students in assigned classes.
- **Attendance Tracking**: Mark daily attendance for assigned sections.
- **Teacher Remarks**: Leave public or private remarks for students.

---

## 5. Database Schema (Prisma)

The database is heavily normalized to ensure data integrity and prevent duplication.

### Users & Authentication
- **User**: The core authentication model. Stores email, hashed password, and `role` (`ADMIN`, `TEACHER`, `STUDENT`).
- **UserPermission / RolePermission**: RBAC models mapping granular permissions to roles or specific users.
- **PasswordResetToken**: Handles secure password reset flows.

### Students
- **Student**: Core student identity, linking to a `User` account, tracking `admissionNumber` and `enrollmentNumber`.
- **StudentProfile**: Personal details (name, DOB, gender, blood group, address).
- **GuardianInfo**: Parents/Guardians contact details.

### Teachers
- **Teacher**: Links to a `User` account. Tracks `employeeId`, qualifications, and joining dates.

### Academics
- **AcademicSession**: Defines the current school year (e.g., "2025-2026").
- **Class**: E.g., "Class 10". Contains a `displayOrder`.
- **Section**: Subsets of classes (e.g., "Section A"). Has capacity limits.
- **Subject**: E.g., "Science". Can be elective or mandatory.
- **StudentEnrollment**: Junction table linking a Student to a specific Section and AcademicSession for a given year.
- **TeacherAssignment**: Junction table linking a Teacher to Sections and Subjects for a given AcademicSession.

### Examinations & Performance
- **Examination**: Defines an exam period (e.g., "Mid Terms").
- **ExaminationSubject**: Links an Examination to a Subject with specific max/passing marks and a date.
- **Mark**: Stores the actual score, grade, and remarks a Student achieved in an ExaminationSubject.
- **Attendance**: Daily tracking of `status` (PRESENT, ABSENT, LATE) for a Student in a Section/Session.

### System Records
- **TeacherRemark**: Text feedback given by a teacher to a student.
- **Document**: Uploaded files/records linked to a student (with Cloudinary integration logic).
- **AuditLog**: Tracks every action taken in the system by any user (who did what, when).
- **Notification**: System alerts for users.
- **SystemSetting**: Global key-value configurations for the school.

---

## 6. How to Generate a PDF from this file
To convert this Markdown file to a beautiful PDF:
1. Open this file in **VS Code**.
2. Install the extension called **"Markdown PDF"** (by yzane).
3. Right-click anywhere in this file and select **"Markdown PDF: Export (pdf)"**.
4. The PDF will be instantly generated in this folder!

*Alternatively, you can open this file in Google Chrome using a Markdown Viewer extension and press `Ctrl+P` (or `Cmd+P`) to "Print to PDF".*
