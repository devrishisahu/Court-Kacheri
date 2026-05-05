// ─── Centralized Constants ──────────────────────────────────────────
// Single source of truth for all enum values, magic strings, and limits.

/**
 * User roles in the system.
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  LAWYER: 'lawyer',
  CLIENT: 'client',
  SUPER_ADMIN: 'super_admin',
});

export const ALL_ROLES = Object.values(ROLES);

/**
 * Case statuses.
 */
export const CASE_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

export const ALL_CASE_STATUSES = Object.values(CASE_STATUS);

/**
 * Deadline types.
 */
export const DEADLINE_TYPE = Object.freeze({
  HEARING: 'hearing',
  FILING: 'filing',
  MEETING: 'meeting',
  OTHER: 'other',
});

export const ALL_DEADLINE_TYPES = Object.values(DEADLINE_TYPE);

/**
 * Deadline statuses.
 */
export const DEADLINE_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
});

export const ALL_DEADLINE_STATUSES = Object.values(DEADLINE_STATUS);

/**
 * Billing invoice statuses.
 */
export const BILLING_STATUS = Object.freeze({
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
});

export const ALL_BILLING_STATUSES = Object.values(BILLING_STATUS);

/**
 * File upload constraints.
 */
export const FILE_UPLOAD = Object.freeze({
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  ALLOWED_EXTENSIONS: /pdf|docx/,
  ALLOWED_MIMES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
});

/**
 * Rate limit settings.
 */
export const RATE_LIMIT = Object.freeze({
  GENERAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GENERAL_MAX: 10000, // Increased for development testing
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX: 1000, // Increased for development testing
});

/**
 * Pagination defaults.
 */
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

/**
 * Fields that should never be set by the client.
 */
export const PROTECTED_FIELDS = [
  'firmId',
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
  'caseNumber',
  'invoiceNumber',
];
