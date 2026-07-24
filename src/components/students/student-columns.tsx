"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button, buttonVariants } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { format } from "date-fns";
import type { StudentStatus } from "@/types/enums";

export type StudentTableType = {
  id: string;
  firstName: string;
  lastName: string;
  enrollmentNumber: string;
  admissionNumber: string;
  status: StudentStatus;
  email: string;
  phone: string;
  className: string;
  sectionName: string;
  academicSession: string;
  createdAt: Date;
};

export const studentColumns: ColumnDef<StudentTableType>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "enrollmentNumber",
    header: "Enrollment No.",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("enrollmentNumber")}</div>
    ),
  },
  {
    id: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold">{row.getValue("name")}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    id: "class",
    header: "Class & Section",
    cell: ({ row }) => (
      <div>
        {row.original.className} - {row.original.sectionName}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const getVariant = () => {
        switch (status) {
          case "ACTIVE":
            return "default"; // or green if configured
          case "GRADUATED":
            return "secondary";
          case "SUSPENDED":
            return "destructive";
          default:
            return "outline";
        }
      };

      return <Badge variant={getVariant() as any}>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Admitted On",
    cell: ({ row }) => (
      <div>{format(row.getValue("createdAt"), "MMM dd, yyyy")}</div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const student = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(student.enrollmentNumber)}
            >
              Copy Enrollment No.
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={`/admin/students/${student.id}`} />}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/admin/students/${student.id}/edit`} />}>
              Edit Details
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/admin/students/${student.id}/attendance`} />}>
              Attendance
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href={`/admin/students/${student.id}/marks`} />}>
              Marks
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
