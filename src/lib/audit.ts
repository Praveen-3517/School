import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { headers } from "next/headers";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

interface AuditLogOptions {
  action: AuditAction;
  entityType: string;
  entityId?: string;
  previousData?: any;
  newData?: any;
  metadata?: any;
}

/**
 * Logs an audit event to the database.
 * This should be called inside server actions after successful database operations.
 */
export async function logAuditEvent({
  action,
  entityType,
  entityId,
  previousData,
  newData,
  metadata,
}: AuditLogOptions) {
  try {
    const session = await getSession();
    
    // Attempt to get IP and User Agent, ignoring errors if not in a request context
    let ipAddress = null;
    let userAgent = null;
    
    try {
      const headersList = await headers();
      ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
      userAgent = headersList.get("user-agent");
    } catch (e) {
      // In some contexts (like testing or background jobs), headers() might not be available
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session?.user?.id || null,
        action,
        entityType,
        entityId,
        previousData: previousData ? JSON.stringify(previousData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // We log the error but we DO NOT throw it.
    // Audit logging failure should not break the main application flow.
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
