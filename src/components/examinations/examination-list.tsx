"use client";

import { Examination, AcademicSession } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileEdit, Trash2, Eye, EyeOff } from "lucide-react";
import { toggleExaminationPublish, deleteExamination } from "@/lib/actions/examination.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type ExamWithDetails = Examination & {
  academicSession: AcademicSession;
  _count: { examinationSubjects: number };
};

export function ExaminationList({ examinations }: { examinations: ExamWithDetails[] }) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setProcessingId(id);
    try {
      const res = await toggleExaminationPublish(id, currentStatus);
      if (res.success) {
        toast.success(currentStatus ? "Examination unpublished" : "Examination published");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this examination? This will remove all associated marks.")) return;
    
    setProcessingId(id);
    try {
      const res = await deleteExamination(id);
      if (res.success) {
        toast.success("Examination deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to delete examination");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Examination Name</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Subjects</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examinations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No examinations found.
              </TableCell>
            </TableRow>
          ) : (
            examinations.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell className="font-medium">{exam.name}</TableCell>
                <TableCell>{exam.academicSession.name}</TableCell>
                <TableCell>
                  {exam.startDate ? format(new Date(exam.startDate), "MMM dd") : "TBD"} -{" "}
                  {exam.endDate ? format(new Date(exam.endDate), "MMM dd, yyyy") : "TBD"}
                </TableCell>
                <TableCell>{exam._count.examinationSubjects} subjects</TableCell>
                <TableCell>
                  <Badge variant={exam.isPublished ? "default" : "secondary"}>
                    {exam.isPublished ? "Published" : "Draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}
                      disabled={processingId === exam.id}
                    >
                      {processingId === exam.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleTogglePublish(exam.id, exam.isPublished)}>
                        {exam.isPublished ? (
                          <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                        ) : (
                          <><Eye className="mr-2 h-4 w-4" /> Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(exam.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
