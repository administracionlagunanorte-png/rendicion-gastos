# Task: Create Backend API Routes and Store for Expense Reimbursement App

## Summary

Created all required backend API routes and Zustand store for the expense reimbursement application (rendición de gastos). All files pass lint checks with zero errors.

## Files Created

### 1. `/home/z/my-project/src/lib/auth-config.ts`
- NextAuth.js v4 configuration with Credentials provider
- bcryptjs password comparison
- JWT session strategy with role and id in token
- Session callback includes role and id from token
- Sign-in page set to '/'

### 2. `/home/z/my-project/src/app/api/auth/[...nextauth]/route.ts`
- NextAuth handler exporting GET and POST

### 3. `/home/z/my-project/src/app/api/auth/register/route.ts`
- POST: User registration with validation
- Email format validation, password min 6 chars
- Duplicate email check (409)
- Role defaults to "USER", supports "ADMIN"
- bcryptjs hash with salt rounds 10
- Returns user without password

### 4. `/home/z/my-project/src/app/api/reports/route.ts`
- GET: List reports with role-based access (ADMIN=all, USER=own)
- Filtering by status, userId, category
- Pagination with page/pageSize params
- Includes user relation and items
- POST: Create new report with title, description, userId
- Status defaults to "DRAFT"
- Only admin can create reports for others

### 5. `/home/z/my-project/src/app/api/reports/[id]/route.ts`
- GET: Single report with items and user
- PUT: Update title/description (only DRAFT/MODIFICATION_REQUESTED)
- PATCH: Status changes with full workflow validation:
  - SUBMITTED: owner only, from DRAFT/MODIFICATION_REQUESTED, must have items
  - APPROVED/REJECTED/MODIFICATION_REQUESTED: admin only, from SUBMITTED
- Creates notifications on status changes
- DELETE: Only DRAFT status, owner or admin

### 6. `/home/z/my-project/src/app/api/upload/route.ts`
- POST: File upload to public/uploads/
- JPG/PNG only, max 5MB
- Unique filename with timestamp prefix
- Returns public URL path

### 7. `/home/z/my-project/src/app/api/seed/route.ts`
- POST: Creates demo data (1 admin, 2 users, 5 reports with items, 3 notifications)
- Credentials: admin@empresa.com, maria@empresa.com, carlos@empresa.com (all: password123)
- Prevents re-seeding if data exists

### 8. `/home/z/my-project/src/lib/store.ts`
- Zustand store with View type for navigation
- currentView, selectedReportId, filters (status, userId, category, dateFrom, dateTo)
- setFilters, resetFilters

### Additional API Routes Created

### 9. `/home/z/my-project/src/app/api/items/route.ts`
- POST: Create expense item with validation
- Auto-updates report totalAmount

### 10. `/home/z/my-project/src/app/api/items/[id]/route.ts`
- PUT: Update expense item with total recalculation
- DELETE: Delete item with total recalculation

### 11. `/home/z/my-project/src/app/api/notifications/route.ts`
- GET: List user's notifications with unreadCount
- Supports unreadOnly filter

### 12. `/home/z/my-project/src/app/api/notifications/[id]/route.ts`
- PATCH: Mark notification as read
- DELETE: Delete notification

### 13. `/home/z/my-project/src/app/api/notifications/mark-all-read/route.ts`
- PATCH: Mark all user's notifications as read

### 14. `/home/z/my-project/src/app/api/stats/route.ts`
- GET: Dashboard statistics
- Admin: total reports, pending, approved, rejected, total users, amounts by status/category, recent reports
- User: personal report counts, approved amount, expenses by category, recent reports

## Key Design Decisions
- All error messages in Spanish for user-facing responses
- Role-based access control (ADMIN vs USER) on every endpoint
- Status transition validation ensures proper workflow
- Automatic notification creation on status changes
- Report totalAmount auto-calculated from items
- Cascade delete on items when report is deleted
