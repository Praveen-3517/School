// =============================================================================
// EduManage — Database Seed Script
// Development-only demo data — DO NOT use in production
// =============================================================================
//
// Run: pnpm prisma db seed
// Or:  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
//
// Development credentials:
//   Admin:   admin@edumanage.dev     / Admin@123456
//   Teacher1: teacher1@edumanage.dev / Teacher@123456
//   Teacher2: teacher2@edumanage.dev / Teacher@123456
//   Students: ENR-2025-000001 to ENR-2025-000010 / Student@123456
// =============================================================================

import { prisma } from "../src/lib/db/prisma";
import { hash } from "@node-rs/argon2";
import dotenv from "dotenv";

dotenv.config();

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  outputLen: 32,
};

async function main() {
  console.log("🌱 Seeding EduManage database...\n");

  // ============================
  // Clean existing data
  // ============================
  console.log("🧹 Cleaning existing data...");
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.mark.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.teacherRemark.deleteMany(),
    prisma.document.deleteMany(),
    prisma.examinationSubject.deleteMany(),
    prisma.examination.deleteMany(),
    prisma.studentEnrollment.deleteMany(),
    prisma.teacherAssignment.deleteMany(),
    prisma.guardianInfo.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.userPermission.deleteMany(),
    prisma.user.deleteMany(),
    prisma.section.deleteMany(),
    prisma.class.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.academicSession.deleteMany(),
    prisma.systemSetting.deleteMany(),
  ]);
  console.log("✅ Clean complete.\n");

  // ============================
  // System Settings
  // ============================
  await prisma.systemSetting.createMany({
    data: [
      {
        key: "app_name",
        value: "EduManage",
        description: "Application name",
        isPublic: true,
      },
      {
        key: "school_name",
        value: "Rahul Sankrityayan Vidyalay",
        description: "School name",
        isPublic: true,
      },
      {
        key: "school_address",
        value: "123 Education Street",
        description: "School address",
        isPublic: true,
      },
      {
        key: "academic_year",
        value: "2025-2026",
        description: "Current academic year",
        isPublic: true,
      },
    ],
  });
  console.log("✅ System settings created.");

  // ============================
  // Academic Session
  // ============================
  const session2025 = await prisma.academicSession.create({
    data: {
      name: "2025-2026",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isCurrent: true,
    },
  });
  console.log("✅ Academic session created: 2025-2026");

  // ============================
  // Classes & Sections
  // ============================
  const classes = await Promise.all([
    prisma.class.create({ data: { name: "Class 9", displayOrder: 9 } }),
    prisma.class.create({ data: { name: "Class 10", displayOrder: 10 } }),
    prisma.class.create({ data: { name: "Class 11", displayOrder: 11 } }),
    prisma.class.create({ data: { name: "Class 12", displayOrder: 12 } }),
  ]);
  console.log(`✅ ${classes.length} classes created.`);

  const sections = await Promise.all([
    // Class 9
    prisma.section.create({ data: { name: "A", classId: classes[0].id, capacity: 40 } }),
    prisma.section.create({ data: { name: "B", classId: classes[0].id, capacity: 40 } }),
    // Class 10
    prisma.section.create({ data: { name: "A", classId: classes[1].id, capacity: 40 } }),
    prisma.section.create({ data: { name: "B", classId: classes[1].id, capacity: 40 } }),
    // Class 11
    prisma.section.create({ data: { name: "A", classId: classes[2].id, capacity: 35 } }),
    // Class 12
    prisma.section.create({ data: { name: "A", classId: classes[3].id, capacity: 35 } }),
  ]);
  console.log(`✅ ${sections.length} sections created.`);

  // ============================
  // Subjects
  // ============================
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: "Mathematics", code: "MATH101" } }),
    prisma.subject.create({ data: { name: "Science", code: "SCI101" } }),
    prisma.subject.create({ data: { name: "English", code: "ENG101" } }),
    prisma.subject.create({ data: { name: "Hindi", code: "HIN101" } }),
    prisma.subject.create({ data: { name: "Social Studies", code: "SST101" } }),
  ]);
  console.log(`✅ ${subjects.length} subjects created.`);

  // ============================
  // Admin User
  // ============================
  const adminPassword = await hash("Admin@123456", ARGON2_OPTIONS);
  const adminUser = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@edumanage.dev",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${adminUser.email}`);

  // ============================
  // Teacher Users
  // ============================
  const teacherPassword = await hash("Teacher@123456", ARGON2_OPTIONS);

  const teacher1User = await prisma.user.create({
    data: {
      name: "Rajesh Kumar",
      email: "teacher1@edumanage.dev",
      username: "teacher1",
      passwordHash: teacherPassword,
      role: "TEACHER",
      isActive: true,
    },
  });
  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacher1User.id,
      employeeId: "EMP-001",
      qualification: "M.Sc. Mathematics",
      specialization: "Mathematics",
      phone: "+91-9876543210",
      joiningDate: new Date("2020-06-01"),
    },
  });

  const teacher2User = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "teacher2@edumanage.dev",
      username: "teacher2",
      passwordHash: teacherPassword,
      role: "TEACHER",
      isActive: true,
    },
  });
  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacher2User.id,
      employeeId: "EMP-002",
      qualification: "M.Sc. Science",
      specialization: "Science & Biology",
      phone: "+91-9876543211",
      joiningDate: new Date("2021-08-01"),
    },
  });
  console.log(`✅ 2 teachers created.`);

  // Teacher Assignments
  await Promise.all([
    // Teacher 1 → Class 9A, Mathematics
    prisma.teacherAssignment.create({
      data: {
        teacherId: teacher1.id,
        sectionId: sections[0].id, // Class 9A
        subjectId: subjects[0].id, // Mathematics
        academicSessionId: session2025.id,
        isClassTeacher: true,
      },
    }),
    // Teacher 2 → Class 9A, Science
    prisma.teacherAssignment.create({
      data: {
        teacherId: teacher2.id,
        sectionId: sections[0].id, // Class 9A
        subjectId: subjects[1].id, // Science
        academicSessionId: session2025.id,
      },
    }),
    // Teacher 1 → Class 10A, Mathematics
    prisma.teacherAssignment.create({
      data: {
        teacherId: teacher1.id,
        sectionId: sections[2].id, // Class 10A
        subjectId: subjects[0].id, // Mathematics
        academicSessionId: session2025.id,
      },
    }),
  ]);
  console.log(`✅ Teacher assignments created.`);

  // ============================
  // Student Users (10 students)
  // ============================
  const studentPassword = await hash("Student@123456", ARGON2_OPTIONS);

  const studentData = [
    {
      firstName: "Aarav",
      lastName: "Patel",
      gender: "MALE" as const,
      dob: "2010-03-15",
      section: 0,
    }, // Class 9A
    {
      firstName: "Diya",
      lastName: "Sharma",
      gender: "FEMALE" as const,
      dob: "2010-07-22",
      section: 0,
    },
    {
      firstName: "Rohan",
      lastName: "Singh",
      gender: "MALE" as const,
      dob: "2010-01-10",
      section: 0,
    },
    {
      firstName: "Ananya",
      lastName: "Gupta",
      gender: "FEMALE" as const,
      dob: "2010-05-30",
      section: 0,
    },
    {
      firstName: "Arjun",
      lastName: "Mehta",
      gender: "MALE" as const,
      dob: "2010-09-18",
      section: 0,
    },
    {
      firstName: "Kavya",
      lastName: "Nair",
      gender: "FEMALE" as const,
      dob: "2009-11-05",
      section: 2,
    }, // Class 10A
    {
      firstName: "Vivaan",
      lastName: "Kumar",
      gender: "MALE" as const,
      dob: "2009-02-14",
      section: 2,
    },
    {
      firstName: "Ishaan",
      lastName: "Verma",
      gender: "MALE" as const,
      dob: "2009-08-20",
      section: 2,
    },
    {
      firstName: "Aisha",
      lastName: "Khan",
      gender: "FEMALE" as const,
      dob: "2009-04-12",
      section: 2,
    },
    {
      firstName: "Dev",
      lastName: "Joshi",
      gender: "MALE" as const,
      dob: "2009-12-28",
      section: 2,
    },
  ];

  const createdStudents = [];
  for (let i = 0; i < studentData.length; i++) {
    const sd = studentData[i];
    const enrollmentNumber = `ENR-2025-${String(i + 1).padStart(6, "0")}`;
    const admissionNumber = `ADM-${String(1001 + i)}`;

    const user = await prisma.user.create({
      data: {
        name: `${sd.firstName} ${sd.lastName}`,
        email: `student${i + 1}@edumanage.dev`,
        username: enrollmentNumber,
        passwordHash: studentPassword,
        role: "STUDENT",
        isActive: true,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        enrollmentNumber,
        admissionNumber,
        admissionDate: new Date("2025-04-01"),
        status: "ACTIVE",
      },
    });

    await prisma.studentProfile.create({
      data: {
        studentId: student.id,
        firstName: sd.firstName,
        lastName: sd.lastName,
        dateOfBirth: new Date(sd.dob),
        gender: sd.gender,
        bloodGroup: "UNKNOWN",
        city: "Delhi",
        state: "Delhi",
        country: "India",
      },
    });

    await prisma.guardianInfo.create({
      data: {
        studentId: student.id,
        fatherName: `${sd.lastName} Sr.`,
        fatherPhone: `+91-98765432${String(i).padStart(2, "0")}`,
        motherName: `Sunita ${sd.lastName}`,
      },
    });

    // Enrollment
    await prisma.studentEnrollment.create({
      data: {
        studentId: student.id,
        sectionId: sections[sd.section].id,
        academicSessionId: session2025.id,
        rollNumber: String(i + 1),
        isActive: true,
      },
    });

    createdStudents.push(student);
  }
  console.log(`✅ ${createdStudents.length} students created.`);

  // ============================
  // Examinations
  // ============================
  const exam1 = await prisma.examination.create({
    data: {
      name: "Unit Test 1",
      academicSessionId: session2025.id,
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-07"),
      isPublished: true,
      description: "First unit test of the academic year",
    },
  });

  const exam2 = await prisma.examination.create({
    data: {
      name: "Mid Term Examination",
      academicSessionId: session2025.id,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2025-09-10"),
      isPublished: true,
    },
  });
  console.log("✅ 2 examinations created.");

  // Examination Subjects
  await Promise.all([
    prisma.examinationSubject.create({
      data: { examinationId: exam1.id, subjectId: subjects[0].id, maxMarks: 25, passingMarks: 8 },
    }),
    prisma.examinationSubject.create({
      data: { examinationId: exam1.id, subjectId: subjects[1].id, maxMarks: 25, passingMarks: 8 },
    }),
    prisma.examinationSubject.create({
      data: { examinationId: exam1.id, subjectId: subjects[2].id, maxMarks: 25, passingMarks: 8 },
    }),
    prisma.examinationSubject.create({
      data: { examinationId: exam2.id, subjectId: subjects[0].id, maxMarks: 100, passingMarks: 33 },
    }),
    prisma.examinationSubject.create({
      data: { examinationId: exam2.id, subjectId: subjects[1].id, maxMarks: 100, passingMarks: 33 },
    }),
    prisma.examinationSubject.create({
      data: { examinationId: exam2.id, subjectId: subjects[2].id, maxMarks: 100, passingMarks: 33 },
    }),
  ]);

  // ============================
  // Sample Marks
  // ============================
  const markEntries = [];
  const gradeThresholds = [
    { min: 90, grade: "A_PLUS" as const },
    { min: 80, grade: "A" as const },
    { min: 70, grade: "B_PLUS" as const },
    { min: 60, grade: "B" as const },
    { min: 50, grade: "C_PLUS" as const },
    { min: 40, grade: "C" as const },
    { min: 33, grade: "D" as const },
    { min: 0, grade: "F" as const },
  ];

  // Unit Test 1 — first 5 students (Class 9A)
  for (const student of createdStudents.slice(0, 5)) {
    for (const subjectIndex of [0, 1, 2]) {
      const maxMarks = 25;
      const obtained = Math.floor(Math.random() * 15 + 10); // 10–25
      const percentage = (obtained / maxMarks) * 100;
      const grade =
        gradeThresholds.find((g) => percentage >= g.min)?.grade ?? "F";

      markEntries.push({
        studentId: student.id,
        examinationId: exam1.id,
        subjectId: subjects[subjectIndex].id,
        teacherId: teacher1.id,
        obtainedMarks: obtained,
        maxMarks,
        grade,
        percentage: Math.round(percentage * 100) / 100,
        isAbsent: false,
      });
    }
  }

  // Mid Term — all 10 students
  for (const student of createdStudents) {
    for (const subjectIndex of [0, 1, 2]) {
      const maxMarks = 100;
      const obtained = Math.floor(Math.random() * 50 + 40); // 40–90
      const percentage = (obtained / maxMarks) * 100;
      const grade =
        gradeThresholds.find((g) => percentage >= g.min)?.grade ?? "F";

      markEntries.push({
        studentId: student.id,
        examinationId: exam2.id,
        subjectId: subjects[subjectIndex].id,
        teacherId: teacher1.id,
        obtainedMarks: obtained,
        maxMarks,
        grade,
        percentage: Math.round(percentage * 100) / 100,
        isAbsent: false,
      });
    }
  }

  await prisma.mark.createMany({ data: markEntries });
  console.log(`✅ ${markEntries.length} mark records created.`);

  // ============================
  // Sample Attendance (last 10 days)
  // ============================
  const attendanceRecords = [];
  const today = new Date();

  for (let dayOffset = 1; dayOffset <= 10; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const student of createdStudents.slice(0, 8)) {
      const rand = Math.random();
      const status =
        rand > 0.9
          ? "ABSENT"
          : rand > 0.85
          ? "LATE"
          : "PRESENT";

      attendanceRecords.push({
        studentId: student.id,
        sectionId: sections[0].id,
        academicSessionId: session2025.id,
        teacherId: teacher1.id,
        date,
        status: status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
      });
    }
  }

  await prisma.attendance.createMany({ data: attendanceRecords });
  console.log(`✅ ${attendanceRecords.length} attendance records created.`);

  // ============================
  // Sample Teacher Remarks
  // ============================
  await prisma.teacherRemark.createMany({
    data: [
      {
        studentId: createdStudents[0].id,
        teacherId: teacher1.id,
        title: "Excellent Performance",
        content:
          "Aarav has shown excellent understanding of mathematical concepts. Keep up the good work!",
        isPublic: true,
      },
      {
        studentId: createdStudents[1].id,
        teacherId: teacher2.id,
        title: "Needs Improvement in Lab Work",
        content:
          "Diya needs to be more careful during laboratory activities. Please practice the procedures at home.",
        isPublic: true,
      },
      {
        studentId: createdStudents[2].id,
        teacherId: teacher1.id,
        title: "Good Progress",
        content:
          "Rohan has made significant improvement in algebra this term. Encourage him to attempt more challenging problems.",
        isPublic: true,
      },
    ],
  });
  console.log("✅ Sample teacher remarks created.");

  // ============================
  // Done
  // ============================
  console.log(`
╔══════════════════════════════════════════════════════╗
║           EduManage Seed Complete! 🎉                 ║
╠══════════════════════════════════════════════════════╣
║  Development Credentials (NEVER USE IN PRODUCTION)   ║
╠══════════════════════════════════════════════════════╣
║  Admin:    admin@edumanage.dev / Admin@123456         ║
║  Teacher1: teacher1@edumanage.dev / Teacher@123456    ║
║  Teacher2: teacher2@edumanage.dev / Teacher@123456    ║
║  Student:  ENR-2025-000001 / Student@123456           ║
╚══════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
