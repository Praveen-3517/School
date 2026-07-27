"use client";

import { useState } from "react";
import { assignTeacherToSubject, removeTeacherAssignment } from "@/lib/actions/teacher.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Section {
  id: string;
  name: string;
  class: {
    id: string;
    name: string;
  };
}

interface TeacherAssignmentFormProps {
  teacherId: string;
  subjects: Subject[];
  sections: Section[];
  currentAssignments: {
    id: string;
    academicSession: string;
    subject: Subject;
    section: Section;
  }[];
}

export function TeacherAssignmentForm({ teacherId, subjects, sections, currentAssignments }: TeacherAssignmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  async function handleAssign() {
    if (!selectedSubject || !selectedSection) {
      toast.error("Please select both a subject and a section");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assignTeacherToSubject({
        teacherId,
        subjectId: selectedSubject,
        sectionId: selectedSection,
        academicSession: "2025-2026",
      });

      if (result.success) {
        toast.success("Subject assigned successfully");
        setSelectedSubject("");
        setSelectedSection("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      const result = await removeTeacherAssignment(id, teacherId);
      if (result.success) {
        toast.success("Assignment removed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign New Subject</CardTitle>
          <CardDescription>Assign a new class and subject to this teacher.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Subject</label>
            <Select value={selectedSubject} onValueChange={(val) => setSelectedSubject(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Class</label>
            <Select value={selectedSection} onValueChange={(val) => setSelectedSection(val || "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map(s => (
                  <SelectItem key={s.id} value={s.id}>Class {s.class.name} - Section {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAssign} disabled={isSubmitting || !selectedSubject || !selectedSection}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Assign
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>Subjects this teacher is currently assigned to.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssignments.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Academic Session</TableHead>
                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentAssignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">
                        {assignment.subject.name} <span className="text-muted-foreground text-xs ml-1">({assignment.subject.code})</span>
                      </TableCell>
                      <TableCell>
                        Class {assignment.section.class.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{assignment.academicSession}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(assignment.id)}
                          disabled={removingId === assignment.id}
                        >
                          {removingId === assignment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg border-dashed">
              <p className="text-muted-foreground">No subjects currently assigned to this teacher.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
