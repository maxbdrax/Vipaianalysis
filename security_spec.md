# Security Specification for WIN GO AI VIP ANALYZER

## 1. Data Invariants
1. `UserProfile`: Users can only read their own profile, unless they are ADMIN. Role can only be set to ADMIN by verified bootstrap admin (`developermaxbd@gmail.com`) or existing ADMIN. Users cannot elevate their own role to ADMIN.
2. `DrawResult`: Document ID must be equal to `drawId`. Must be valid alphanumeric string up to 64 chars. Result must be integer between 0 and 9. Only ADMIN and ANALYST can create draw results. Only ADMIN can update or delete draw results. VIEWERS have read-only access.
3. `AuditLog`: Immutable once written. Only authenticated users with ADMIN or ANALYST can create audit logs. Only ADMIN can read audit logs.
4. `AppSetting`: Only ADMIN can create or modify application settings. All authenticated users can read settings.

## 2. The "Dirty Dozen" Payloads
1. Unauthorized User writing to `/drawResults/{drawId}` with missing auth (Anonymous/Unauthenticated). Result: PERMISSION_DENIED.
2. VIEWER role attempting to `create` `/drawResults/{drawId}`. Result: PERMISSION_DENIED.
3. ANALYST role attempting to `delete` `/drawResults/{drawId}`. Result: PERMISSION_DENIED.
4. User attempting to forge another user's `createdBy` or `userId`. Result: PERMISSION_DENIED.
5. Injected invalid result number: `result: 15` or `result: -1` or string `result: "five"`. Result: PERMISSION_DENIED.
6. Malicious shadow/ghost fields in draw result (e.g. `isSuperAdmin: true`). Result: PERMISSION_DENIED.
7. Oversized notes (> 500 characters) or oversized drawId (> 64 chars). Result: PERMISSION_DENIED.
8. Non-owner trying to read `/users/{otherUserId}` without ADMIN privileges. Result: PERMISSION_DENIED.
9. User attempting to escalate their own role to ADMIN in `/users/{userId}`. Result: PERMISSION_DENIED.
10. VIEWER role attempting to update `/appSettings/{settingId}`. Result: PERMISSION_DENIED.
11. Updating immutable fields (e.g. attempting to change `drawId` or `createdAt` on an existing document). Result: PERMISSION_DENIED.
12. Attempting to delete or tamper with `/auditLogs/{logId}` records. Result: PERMISSION_DENIED.
