export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  BOTH = 'BOTH',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  REJECTED = 'REJECTED',
}

export enum ConflictStatus {
  DETECTED = 'DETECTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ConflictType {
  DUPLICATE_VENDOR = 'DUPLICATE_VENDOR',
  SCHEDULE = 'SCHEDULE',
  INFORMATION_MISMATCH = 'INFORMATION_MISMATCH',
  APPROVAL_STALL = 'APPROVAL_STALL',
}

export enum ConflictSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RETURNED = 'RETURNED',
  REJECTED = 'REJECTED',
}

export enum ProgramStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum DivisionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  PROGRAMS_VIEW_ALL: 'programs:view_all',
  PROGRAMS_VIEW_SCOPED: 'programs:view_scoped',
  TASKS_CREATE: 'tasks:create',
  TASKS_ASSIGN: 'tasks:assign',
  TASKS_UPDATE: 'tasks:update',
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_REVIEW: 'documents:review',
  APPROVALS_DECIDE: 'approvals:decide',
  CONFLICTS_RESOLVE: 'conflicts:resolve',
  AUDIT_VIEW: 'audit:view',
  AUDIT_VIEW_SCOPED: 'audit:view_scoped',
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_DIVISIONS: 'admin:divisions',
  ADMIN_SYSTEM: 'admin:system',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATIONS_COORDINATOR: 'OPERATIONS_COORDINATOR',
  DIVISION_PIC: 'DIVISION_PIC',
  REVIEWER: 'REVIEWER',
  APPROVER: 'APPROVER',
  VIEWER: 'VIEWER',
} as const;

export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  requestId?: string;
}
