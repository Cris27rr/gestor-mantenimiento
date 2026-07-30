import type { AccessLog, AuditLog } from "@/types";
import { getItem, setItem, uuid } from "@/lib/auth/storageUtils";

const AUDIT_LOGS_KEY = "medimaint_audit_logs";
const ACCESS_LOGS_KEY = "medimaint_access_logs";

export function recordAuditLog(
  userId: string,
  userEmail: string,
  action: string,
  entityType: string,
  entityId: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): void {
  const logs = getItem<AuditLog>(AUDIT_LOGS_KEY);
  logs.push({
    id: uuid(),
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: "client",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
    createdAt: new Date().toISOString(),
  });
  setItem(AUDIT_LOGS_KEY, logs.length > 5000 ? logs.slice(-5000) : logs);
}

export function recordAccessLog(
  userId: string,
  userEmail: string,
  action: AccessLog["action"],
  details: string
): void {
  const logs = getItem<AccessLog>(ACCESS_LOGS_KEY);
  logs.push({
    id: uuid(),
    userId,
    userEmail,
    action,
    ipAddress: "client",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : "",
    details,
    createdAt: new Date().toISOString(),
  });
  setItem(ACCESS_LOGS_KEY, logs.length > 2000 ? logs.slice(-2000) : logs);
}

export const localAuditLogs = {
  getAll: (): AuditLog[] =>
    getItem<AuditLog>(AUDIT_LOGS_KEY).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  getByUserId: (userId: string): AuditLog[] =>
    getItem<AuditLog>(AUDIT_LOGS_KEY).filter((l) => l.userId === userId),
  getByEntity: (entityType: string, entityId: string): AuditLog[] =>
    getItem<AuditLog>(AUDIT_LOGS_KEY).filter(
      (l) => l.entityType === entityType && l.entityId === entityId
    ),
};

export const localAccessLogs = {
  getAll: (): AccessLog[] =>
    getItem<AccessLog>(ACCESS_LOGS_KEY).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
};
