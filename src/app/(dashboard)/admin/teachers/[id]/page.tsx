import { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Edit, Briefcase, User, Phone, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Teacher Profile | EduManage",
  description: "View teacher details and subject assignments.",
};

interface TeacherProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherProfilePage(props: TeacherProfilePageProps) {
  const params = await props.params;
  await requireAdmin();

  const teacher = await prisma.teacher.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      assignments: {
        include: {
          subject: true,
          section: { include: { class: true } },
          academicSession: true
        }
      }
    },
  });

  if (!teacher) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/teachers">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back to teachers</span>
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Teacher Profile</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/teachers/${teacher.id}/assignments`}>
              Manage Assignments
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/admin/teachers/${teacher.id}/permissions`}>
              Access Control
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/teachers/${teacher.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        {/* Profile Summary Card */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {teacher.user.name.charAt(0)}
              </div>
            </div>
            <CardTitle className="text-center text-2xl">{teacher.user.name}</CardTitle>
            <CardDescription className="text-center">
              <Badge variant={teacher.user.isActive ? "default" : "destructive"}>
                {teacher.user.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Employee ID</p>
                <p className="text-muted-foreground">{teacher.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Designation</p>
                <p className="text-muted-foreground">Teacher - {teacher.specialization || "General"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Contact</p>
                <p className="text-muted-foreground">{teacher.user.phone || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments & Details */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Assignments</CardTitle>
              <CardDescription>Classes and subjects currently taught by this teacher.</CardDescription>
            </CardHeader>
            <CardContent>
              {teacher.assignments.length > 0 ? (
                <div className="space-y-4">
                  {teacher.assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{assignment.subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Class {assignment.section.class.name} - {assignment.section.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{assignment.academicSession?.name}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border rounded-lg border-dashed">
                  <p className="text-muted-foreground">No subjects currently assigned.</p>
                  <Button variant="link" className="mt-2" asChild>
                    <Link href={`/admin/teachers/${teacher.id}/assignments`}>Assign Subjects</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Login Email</p>
                <p>{teacher.user.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Joining Date</p>
                <p>{teacher.joiningDate ? format(teacher.joiningDate, "MMM dd, yyyy") : "N/A"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
