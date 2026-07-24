import { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "My Marks | EduManage",
  description: "View your examination marks and grades.",
};

export default async function StudentMarksPage() {
  const session = await requireSession();

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    include: {
      marks: {
        include: {
          examination: true,
          subject: true,
        },
        orderBy: [
          { examination: { createdAt: 'desc' } },
          { subject: { name: 'asc' } }
        ]
      }
    }
  });

  if (!student) {
    return <div>Student profile not found.</div>;
  }

  // Filter marks to only show published examinations
  const publishedMarks = student.marks.filter(m => m.examination.isPublished);

  // Group marks by examination
  const marksByExam = publishedMarks.reduce((acc, mark) => {
    if (!acc[mark.examinationId]) {
      acc[mark.examinationId] = {
        examination: mark.examination,
        marks: []
      };
    }
    acc[mark.examinationId].marks.push(mark);
    return acc;
  }, {} as Record<string, { examination: any, marks: any[] }>);

  const groupedExams = Object.values(marksByExam);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Marks & Grades</h2>
        <p className="text-muted-foreground">Detailed view of your performance across all published examinations.</p>
      </div>

      {groupedExams.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center h-48">
            <p className="text-muted-foreground">No examination results have been published yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 mt-4">
          {groupedExams.map((group) => {
            // Calculate overall percentage for this exam
            const totalObtained = group.marks.reduce((sum, m) => sum + (m.obtainedMarks || 0), 0);
            const totalMax = group.marks.reduce((sum, m) => sum + m.maxMarks, 0);
            const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0";

            return (
              <Card key={group.examination.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.examination.name}</CardTitle>
                    <CardDescription>
                      Date: {group.examination.startDate ? new Date(group.examination.startDate).toLocaleDateString() : 'N/A'} 
                      {group.examination.endDate ? ` to ${new Date(group.examination.endDate).toLocaleDateString()}` : ''}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-2xl font-bold">{overallPercentage}%</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Max Marks</TableHead>
                        <TableHead className="text-right">Obtained</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.marks.map((mark) => (
                        <TableRow key={mark.id}>
                          <TableCell className="font-medium">{mark.subject.name}</TableCell>
                          <TableCell className="text-right">{mark.maxMarks}</TableCell>
                          <TableCell className="text-right">
                            {mark.isAbsent ? (
                              <Badge variant="destructive">ABS</Badge>
                            ) : (
                              mark.obtainedMarks
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {mark.isAbsent ? "-" : <Badge variant="outline" className="font-bold">{mark.grade}</Badge>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {mark.remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
