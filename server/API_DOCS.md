# Court-Kacheri API Documentation

> **Base URL:** `http://localhost:5000/api`
> **Auth:** Bearer token in `Authorization` header
> **Response Format:** `{ success, message, data, meta? }`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Firms](#2-firms)
3. [Clients](#3-clients)
4. [Cases](#4-cases)
5. [Documents](#5-documents)
6. [Deadlines](#6-deadlines)
7. [Time Entries](#7-time-entries)
8. [Billing](#8-billing)

---

## 1. Authentication

### POST `/auth/register`
**Access:** Public  |  **Rate Limit:** 10 req / 15 min

**Body:**
```json
{
  "name": "Rishi Sahu",
  "email": "rishi@example.com",
  "password": "secret123",
  "role": "admin",
  "firmName": "Sharma & Associates"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "664a...",
    "name": "Rishi Sharma",
    "email": "rishi@example.com",
    "role": "admin",
    "firmId": "664a...",
    "token": "eyJhbG..."
  }
}
```

---

### POST `/auth/login`
**Access:** Public  |  **Rate Limit:** 10 req / 15 min

**Body:**
```json
{
  "email": "rishi@example.com",
  "password": "secret123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "664a...",
    "name": "Rishi Sharma",
    "email": "rishi@example.com",
    "role": "admin",
    "firmId": "664a...",
    "token": "eyJhbG..."
  }
}
```

---

### GET `/auth/me`
**Access:** Private

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "_id": "664a...",
    "name": "Rishi Sharma",
    "email": "rishi@example.com",
    "role": "admin",
    "firmId": { "_id": "664a...", "name": "Sharma & Associates" }
  }
}
```

---

## 2. Firms

### POST `/firms/create`
**Access:** Private  |  Requires no existing firm

**Body:**
```json
{ "name": "Sharma & Associates" }
```

**Response (201):**
```json
{
  "success": true,
  "message": "Firm created successfully",
  "data": { "_id": "664a...", "name": "Sharma & Associates", "createdBy": "664a..." }
}
```

---

### GET `/firms/me`
**Access:** Private

Returns the firm of the logged-in user.

---

## 3. Clients

### POST `/clients`
**Access:** Private (firm members)

**Body:**
```json
{
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "+91-9876543210"
}
```

---

### GET `/clients`
**Access:** Private (firm members)

**Query Params:**
| Param    | Type   | Description                |
|----------|--------|----------------------------|
| `page`   | number | Page number (default: 1)   |
| `limit`  | number | Items per page (max: 100)  |
| `search` | string | Search by name (regex)     |
| `sort`   | string | Sort fields (e.g. `name,-createdAt`) |

**Response (200):**
```json
{
  "success": true,
  "message": "Clients retrieved",
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 10, "pages": 5 }
}
```

---

### GET `/clients/:id`  |  PUT `/clients/:id`  |  DELETE `/clients/:id`
Standard CRUD operations. PUT accepts partial updates.

---

## 4. Cases

### POST `/cases`
**Access:** Private (firm members)

**Body:**
```json
{
  "title": "Land Dispute — Plot 45B",
  "description": "Civil case regarding boundary dispute",
  "clientId": "664a...",
  "assignedLawyers": ["664b...", "664c..."],
  "status": "open"
}
```

> `caseNumber` is auto-generated (e.g. `CK-2026-0001`).

---

### GET `/cases`
**Query Params:**
| Param      | Type   | Description              |
|------------|--------|--------------------------|
| `page`     | number | Page number              |
| `limit`    | number | Items per page           |
| `status`   | string | `open` or `closed`       |
| `clientId` | string | Filter by client         |
| `search`   | string | Search by title          |
| `sort`     | string | Sort fields              |

---

### GET `/cases/:id`  |  PUT `/cases/:id`  |  DELETE `/cases/:id`
Standard CRUD. Responses populate `clientId` and `assignedLawyers`.

---

## 5. Documents

### POST `/documents`
**Access:** Private (firm members)  |  **Content-Type:** `multipart/form-data`

**Fields:**
| Field    | Type   | Description                    |
|----------|--------|--------------------------------|
| `file`   | File   | PDF or DOCX only (max 10 MB)   |
| `caseId` | string | The case to attach the file to |

**Response (201):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "_id": "664a...",
    "caseId": "664a...",
    "fileUrl": "/uploads/file-17198...",
    "fileName": "contract.pdf",
    "fileSize": 245760,
    "mimeType": "application/pdf",
    "uploadedBy": "664a..."
  }
}
```

---

### GET `/documents/:caseId`
Returns paginated documents for a case.

### DELETE `/documents/:id`
Deletes the document record AND removes the file from disk.

---

## 6. Deadlines

### POST `/deadlines`
**Access:** Private (firm members)

**Body:**
```json
{
  "caseId": "664a...",
  "title": "Next Hearing Date",
  "description": "Appear before Hon'ble Judge",
  "dueDate": "2026-06-15T10:00:00.000Z",
  "type": "hearing"
}
```

> **Conflict Detection:** If another deadline on the same case exists within ±1 hour, the response includes a `conflicts` array.

**Types:** `hearing`, `filing`, `meeting`, `other`
**Statuses:** `upcoming`, `completed`, `overdue` (auto-flagged)

---

### GET `/deadlines`
**Query Params:**
| Param    | Type   | Description                  |
|----------|--------|------------------------------|
| `status` | string | Filter by status             |
| `caseId` | string | Filter by case               |
| `type`   | string | Filter by type               |
| `from`   | string | Start of date range (ISO)    |
| `to`     | string | End of date range (ISO)      |
| `sort`   | string | Default: `dueDate`           |

---

### GET `/deadlines/conflicts/:caseId`
Returns all pairs of deadlines within ±1 hour of each other on the specified case.

---

### GET `/deadlines/:id`  |  PUT `/deadlines/:id`  |  DELETE `/deadlines/:id`
Standard CRUD.

---

## 7. Time Entries

### POST `/time-entries/start`
**Access:** Private (firm members)

**Body:**
```json
{
  "caseId": "664a...",
  "description": "Drafting response brief",
  "billable": true
}
```

> Only **one timer per user** can run at a time.

---

### POST `/time-entries/:id/stop`
Stops the running timer. Auto-calculates `duration` in minutes.

**Optional Body:**
```json
{ "description": "Updated description after stopping" }
```

**Response:**
```json
{
  "success": true,
  "message": "Timer stopped — 45 minutes recorded",
  "data": { ... }
}
```

---

### GET `/time-entries`
**Query Params:**
| Param      | Type    | Description              |
|------------|---------|--------------------------|
| `caseId`   | string  | Filter by case           |
| `userId`   | string  | Filter by user           |
| `billable` | boolean | Filter billable entries  |
| `from`     | string  | Start date range (ISO)   |
| `to`       | string  | End date range (ISO)     |

---

### GET `/time-entries/summary/:caseId`
Returns aggregated time data for a case:
```json
{
  "data": {
    "caseId": "664a...",
    "caseNumber": "CK-2026-0001",
    "totalHours": 12.5,
    "billableHours": 10.25,
    "totalEntries": 8
  }
}
```

---

### DELETE `/time-entries/:id`
Deletes a time entry.

---

## 8. Billing

### POST `/billing`
**Access:** Private (**admin only**)

**Body (manual items):**
```json
{
  "caseId": "664a...",
  "clientId": "664b...",
  "items": [
    { "description": "Consultation", "hours": 2, "rate": 500, "amount": 1000 },
    { "description": "Court appearance", "hours": 4, "rate": 500, "amount": 2000 }
  ],
  "dueDate": "2026-07-01T00:00:00.000Z",
  "notes": "Payment due within 30 days"
}
```

**Body (auto-generate from time entries):**
```json
{
  "caseId": "664a...",
  "clientId": "664b...",
  "rate": 500,
  "dueDate": "2026-07-01T00:00:00.000Z"
}
```
> If `items` is empty and `rate` is provided, line items are auto-generated from billable time entries.

> `invoiceNumber` is auto-generated (e.g. `INV-2026-0001`).
> `totalAmount` is auto-calculated from items.

---

### GET `/billing`
**Query Params:** `status`, `caseId`, `clientId`, `page`, `limit`, `sort`

**Statuses:** `draft`, `sent`, `paid`, `overdue`

---

### GET `/billing/:id`  |  PUT `/billing/:id`  |  DELETE `/billing/:id`
**Access:** admin only (except GET which is all firm members)

---

### PUT `/billing/:id/status`
**Access:** admin only

**Body:**
```json
{ "status": "paid" }
```

---

### GET `/billing/summary`
**Access:** admin only

Returns revenue breakdown by status:
```json
{
  "data": {
    "byStatus": {
      "paid": { "count": 12, "total": 150000 },
      "draft": { "count": 3, "total": 25000 }
    },
    "grandTotal": 175000,
    "invoiceCount": 15
  }
}
```

---

## Common Patterns

### Authentication
All protected routes require:
```
Authorization: Bearer <token>
```

### Error Response
```json
{
  "success": false,
  "message": "Client not found",
  "stack": "..." // only in development
}
```

### Pagination Meta
```json
{
  "meta": { "total": 100, "page": 2, "limit": 10, "pages": 10 }
}
```

### Rate Limiting
- **General:** 100 requests / 15 minutes
- **Auth endpoints:** 10 requests / 15 minutes
