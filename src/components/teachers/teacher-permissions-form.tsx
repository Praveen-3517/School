"use client";

import { useState } from "react";
import { updateTeacherPermissions } from "@/lib/actions/teacher.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Permission } from "@/types/enums";

interface TeacherPermissionsFormProps {
  userId: string;
  initialPermissions: Permission[];
}

// Full list of permissions available in the system
const AVAILABLE_PERMISSIONS: { value: Permission; label: string; description: string }[] = [
  {
    value: "MARK_CREATE",
    label: "Manage Marks",
    description: "Allow teacher to create, edit, and publish exam marks."
  },
  {
    value: "ATTENDANCE_CREATE",
    label: "Manage Attendance",
    description: "Allow teacher to record and modify student attendance."
  },
  {
    value: "CLASS_MANAGE",
    label: "Manage Classes",
    description: "Allow teacher to manage class/section structure."
  },
];

export function TeacherPermissionsForm({ userId, initialPermissions }: TeacherPermissionsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(initialPermissions);

  const togglePermission = (permission: Permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const result = await updateTeacherPermissions(userId, selectedPermissions);

      if (result.success) {
        toast.success("Permissions updated successfully");
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <CardTitle>Access Control</CardTitle>
          </div>
          <CardDescription>
            Grant specific system permissions to this teacher. By default, teachers have read-only access to their assigned classes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            {AVAILABLE_PERMISSIONS.map((permission) => (
              <div key={permission.id} className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <Checkbox
                  id={`perm-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={(checked) => handleToggle(permission.id, checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <label 
                    htmlFor={`perm-${permission.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {permission.label}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {permission.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
