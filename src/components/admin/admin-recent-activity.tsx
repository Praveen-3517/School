"use client";

import { formatRelativeTime } from "@/lib/utils/utils";
import { Badge } from "@/components/ui/badge";
import type { AuditAction } from "@/types/enums";

const ACTION_LABELS: Partial<Record<AuditAction, { label: string; color: string }>> = {
  STUDENT_CREATED: { label: "Student Created", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  STUDENT_UPDATED: { label: "Student Updated", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  STUDENT_DEACTIVATED: { label: "Student Deactivated", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  STUDENT_REACTIVATED: { label: "Student Reactivated", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  TEACHER_CREATED: { label: "Teacher Created", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  TEACHER_UPDATED: { label: "Teacher Updated", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400" },
  MARK_UPDATED: { label: "Marks Updated", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ATTENDANCE_UPDATED: { label: "Attendance Updated", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  USER_LOGIN: { label: "User Login", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  SETTINGS_UPDATED: { label: "Settings Updated", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400" },
};

interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  createdAt: Date;
  actor: { name: string; role: string } | null;
}

interface AdminRecentActivityProps {
  logs: AuditLogEntry[];
}

export function AdminRecentActivity({ logs }: AdminRecentActivityProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No recent activity to display.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {logs.map((log, index) => {
        const actionInfo = ACTION_LABELS[log.action] ?? {
          label: log.action.replace(/_/g, " "),
          color: "bg-gray-100 text-gray-800",
        };

        return (
          <div
            key={log.id}
            className={`flex items-start justify-between py-3 ${
              index < logs.length - 1 ? "border-b" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${actionInfo.color}`}
                >
                  {actionInfo.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  by{" "}
                  <span className="font-medium text-foreground">
                    {log.actor?.name ?? "System"}
                  </span>
                  {log.actor?.role && (
                    <span className="text-muted-foreground"> ({log.actor.role})</span>
                  )}
                </p>
              </div>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap ml-4">
              {formatRelativeTime(log.createdAt)}
            </time>
          </div>
        );
      })}
    </div>
  );
}
