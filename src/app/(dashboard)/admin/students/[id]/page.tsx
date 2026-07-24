import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, GraduationCap, User, Phone, MapPin, Calendar, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Student Profile | EduManage",
  description: "View student details and academic records.",
};

interface StudentProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentProfilePage(props: StudentProfilePageProps) {
  const params = await props.params;
  await requireAdmin();

  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      guardian: true,
      enrollments: {
        where: { isActive: true },
        include: { section: { include: { class: true } } },
      },
      user: true,
    },
  });

  if (!student || !student.profile) {
    notFound();
  }

  const enrollment = student.enrollments[0];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to students</span>
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
        </div>
        <Button asChild>
          <Link href={`/admin/students/${student.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {student.profile.firstName.charAt(0)}{student.profile.lastName.charAt(0)}
              </div>
            </div>
            <CardTitle className="text-center text-2xl">{student.profile.firstName} {student.profile.lastName}</CardTitle>
            <CardDescription className="text-center">
              <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                {student.status}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Enrollment No.</p>
                <p className="text-muted-foreground">{student.enrollmentNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Current Class</p>
                <p className="text-muted-foreground">
                  {enrollment ? `${enrollment.section.class.name} - ${enrollment.section.name}` : "Not Enrolled"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Contact</p>
                <p className="text-muted-foreground">{student.profile.phone || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info Tabs/Cards */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p>{format(student.profile.dateOfBirth, "MMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                <p>{student.profile.bloodGroup || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{student.profile.address}</p>
              </div>
            </CardContent>
          </Card>

          {student.guardian && (
            <Card>
              <CardHeader>
                <CardTitle>Guardian Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name ({student.guardian.relationship || "Father"})</p>
                  <p>{student.guardian.fatherName || student.guardian.guardianName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{student.guardian.fatherPhone || student.guardian.guardianPhone || "N/A"}</p>
                </div>
                {(student.guardian.fatherEmail || student.guardian.guardianEmail) && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{student.guardian.fatherEmail || student.guardian.guardianEmail}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
