"use client";

import { useState } from "react";
import { saveMarksBatch } from "@/lib/actions/mark.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";

interface StudentInfo {
  id: string;
  name: string;
  enrollmentNo: string;
}

interface ExistingMark {
  studentId: string;
  obtainedMarks: number | null;
  isAbsent: boolean;
  remarks: string | null;
}

interface MarkEntryTableProps {
  examinationId: string;
  subjectId: string;
  maxMarks: number;
  students: StudentInfo[];
  existingMarks: ExistingMark[];
  disabled?: boolean;
}

export function MarkEntryTable({ examinationId, subjectId, maxMarks, students, existingMarks, disabled = false }: MarkEntryTableProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state from existing marks or defaults
  const [entries, setEntries] = useState(
    students.map(student => {
      const existing = existingMarks.find(m => m.studentId === student.id);
      return {
        studentId: student.id,
        obtainedMarks: existing?.obtainedMarks !== undefined && existing?.obtainedMarks !== null ? existing.obtainedMarks.toString() : "",
        isAbsent: existing?.isAbsent || false,
        remarks: existing?.remarks || "",
      };
    })
  );

  const handleMarkChange = (index: number, value: string) => {
    const updated = [...entries];
    // Allow empty string to mean "null" (not entered yet)
    updated[index].obtainedMarks = value;
    
    // Automatically uncheck absent if marks are entered
    if (value && updated[index].isAbsent) {
      updated[index].isAbsent = false;
    }
    setEntries(updated);
  };

  const handleAbsentChange = (index: number, checked: boolean) => {
    const updated = [...entries];
    updated[index].isAbsent = checked;
    // Clear marks if marked absent
    if (checked) {
      updated[index].obtainedMarks = "";
    }
    setEntries(updated);
  };

  const handleRemarksChange = (index: number, value: string) => {
    const updated = [...entries];
    updated[index].remarks = value;
    setEntries(updated);
  };

  async function handleSave() {
    // Validate client-side
    for (const entry of entries) {
      if (!entry.isAbsent && entry.obtainedMarks !== "") {
        const val = parseFloat(entry.obtainedMarks);
        if (val < 0 || val > maxMarks) {
          toast.error(`Marks must be between 0 and ${maxMarks}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formattedMarks = entries.map(e => ({
        studentId: e.studentId,
        obtainedMarks: e.obtainedMarks === "" ? undefined : parseFloat(e.obtainedMarks),
        isAbsent: e.isAbsent,
        remarks: e.remarks || undefined,
      }));

      const result = await saveMarksBatch({
        examinationId,
        subjectId,
        maxMarks,
        marks: formattedMarks
      });

      if (result.success) {
        toast.success("Marks saved successfully");
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">
          Enter marks out of <strong>{maxMarks}</strong>. Leave blank if not evaluated yet.
        </p>
        <Button onClick={handleSave} disabled={isSubmitting || disabled}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Marks
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Enrol. No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[150px]">Marks Obtained</TableHead>
              <TableHead className="w-[100px] text-center">Absent</TableHead>
              <TableHead>Remarks (Optional)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No students enrolled in this class.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, idx) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.enrollmentNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={maxMarks}
                      step={0.5}
                      value={entries[idx].obtainedMarks}
                      onChange={(e) => handleMarkChange(idx, e.target.value)}
                      disabled={entries[idx].isAbsent || disabled}
                      className="w-24"
                      placeholder={`/ ${maxMarks}`}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={entries[idx].isAbsent}
                      onCheckedChange={(checked) => handleAbsentChange(idx, checked as boolean)}
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={entries[idx].remarks}
                      onChange={(e) => handleRemarksChange(idx, e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. Needs improvement"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
