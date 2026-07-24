// =============================================================================
// EduManage — Audit Logging Utility
// All sensitive actions are tracked here
// =============================================================================

import { prisma } from "@/lib/db/prisma";
import type { AuditAction } from "@/types/enums";

export interface AuditLogEntry {
  actorUserId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry.
 * This is a fire-and-forget operation — it should never block the main operation.
 * Errors are caught and logged to console only — never exposed to users.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        // Strip sensitive fields before storing and stringify for SQLite
        previousData: sanitizeForAudit(entry.previousData) ? JSON.stringify(sanitizeForAudit(entry.previousData)) : null,
        newData: sanitizeForAudit(entry.newData) ? JSON.stringify(sanitizeForAudit(entry.newData)) : null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (error) {
    // Never fail the main operation due to audit logging failure
    console.error("[AuditLog] Failed to create audit log entry:", error);
  }
}

/**
 * Remove sensitive fields before storing in audit log.
 * NEVER store passwords, tokens, or hashes in audit logs.
 */
function sanitizeForAudit(
  data?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!data) return undefined;

  const sensitiveFields = [
    "passwordHash",
    "password",
    "token",
    "secret",
    "apiKey",
    "creditCard",
  ];

  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
}

/**
 * Get audit logs with filtering — Admin only.
 */
export async function getAuditLogs({
  actorUserId,
  action,
  entityType,
  entityId,
  startDate,
  endDate,
  page = 1,
  pageSize = 20,
}: {
  actorUserId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const where = {
    ...(actorUserId && { actorUserId }),
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        previousData: true,
        newData: true,
        ipAddress: true,
        createdAt: true,
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
