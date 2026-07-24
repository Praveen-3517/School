import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "My Profile | EduManage",
  description: "View your student profile information.",
};

export default async function StudentProfilePage() {
  const session = await requireSession();

  if (session.user.role !== "STUDENT" && session.user.role !== "PARENT") {
    redirect("/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      profile: true,
      guardian: true,
      user: true,
    }
  });

  if (!student || !student.profile) {
    return <div>Student profile not found.</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground">Personal and guardian information on record.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Your registered personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p>{student.profile.firstName} {student.profile.lastName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admission No.</p>
                <p>{student.admissionNumber}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                <p>{student.profile.dateOfBirth ? format(new Date(student.profile.dateOfBirth), "MMMM dd, yyyy") : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                <p className="capitalize">{student.profile.gender.toLowerCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blood Group</p>
                <p>{student.profile.bloodGroup}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p>{student.profile.phone || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{student.profile.address || "N/A"}</p>
                <p>{student.profile.city} {student.profile.state} {student.profile.postalCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guardian Details</CardTitle>
            <CardDescription>Emergency contact and parent information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!student.guardian ? (
              <p className="text-muted-foreground text-sm">No guardian information recorded.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Father's Name</p>
                    <p>{student.guardian.fatherName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Father's Phone</p>
                    <p>{student.guardian.fatherPhone || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mother's Name</p>
                    <p>{student.guardian.motherName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mother's Phone</p>
                    <p>{student.guardian.motherPhone || "N/A"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Local Guardian</p>
                    <p>{student.guardian.guardianName || "N/A"} ({student.guardian.relationship || ""})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Guardian Phone</p>
                    <p>{student.guardian.guardianPhone || "N/A"}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
