"use client";

import { useState } from "react";
import { saveAttendanceBatch } from "@/lib/actions/attendance.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface StudentInfo {
  id: string;
  name: string;
  enrollmentNo: string;
}

interface ExistingAttendance {
  studentId: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | string;
  remarks: string | null;
}

interface AttendanceTableProps {
  date: string;
  sectionId: string;
  subjectId?: string;
  academicSessionId: string;
  students: StudentInfo[];
  existingRecords: ExistingAttendance[];
  disabled?: boolean;
}

export function AttendanceTable({ 
  date, sectionId, subjectId, academicSessionId, students, existingRecords, disabled = false 
}: AttendanceTableProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize state from existing records or default to "PRESENT"
  const [entries, setEntries] = useState(
    students.map(student => {
      const existing = existingRecords.find(r => r.studentId === student.id);
      return {
        studentId: student.id,
        status: existing?.status || "PRESENT",
        remarks: existing?.remarks || "",
      };
    })
  );

  const handleStatusChange = (index: number, value: string) => {
    const updated = [...entries];
    updated[index].status = value;
    setEntries(updated);
  };

  const handleRemarksChange = (index: number, value: string) => {
    const updated = [...entries];
    updated[index].remarks = value;
    setEntries(updated);
  };

  const markAllAs = (status: string) => {
    const updated = entries.map(entry => ({ ...entry, status }));
    setEntries(updated);
  };

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const formattedRecords = entries.map(e => ({
        studentId: e.studentId,
        status: e.status as "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY",
        remarks: e.remarks || undefined,
      }));

      const result = await saveAttendanceBatch({
        date,
        sectionId,
        subjectId,
        academicSessionId,
        records: formattedRecords
      });

      if (result.success) {
        toast.success("Attendance saved successfully");
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case "PRESENT": return "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20";
      case "ABSENT": return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20";
      case "LATE": return "bg-yellow-500/10 text-yellow-700 border-yellow-200 hover:bg-yellow-500/20";
      case "HALF_DAY": return "bg-orange-500/10 text-orange-700 border-orange-200 hover:bg-orange-500/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 p-4 border rounded-md bg-muted/20">
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">Quick Actions:</p>
          <Button variant="outline" size="sm" onClick={() => markAllAs("PRESENT")} disabled={disabled}>All Present</Button>
          <Button variant="outline" size="sm" onClick={() => markAllAs("ABSENT")} disabled={disabled}>All Absent</Button>
        </div>
        <Button onClick={handleSave} disabled={isSubmitting || disabled}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Attendance
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Enrol. No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[200px]">Status</TableHead>
              <TableHead>Remarks (Optional)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No students enrolled in this class.
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, idx) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.enrollmentNo}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <Select 
                      disabled={disabled}
                      value={entries[idx].status}
                      onValueChange={(val) => handleStatusChange(idx, val)}
                    >
                      <SelectTrigger className={getStatusColor(entries[idx].status)}>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">Present</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                        <SelectItem value="LATE">Late</SelectItem>
                        <SelectItem value="HALF_DAY">Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={entries[idx].remarks}
                      onChange={(e) => handleRemarksChange(idx, e.target.value)}
                      disabled={disabled}
                      placeholder="e.g. Doctor's appointment"
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
