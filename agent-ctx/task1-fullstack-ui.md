# Task: Build Complete UI for Expense Reimbursement Application

## Summary
All 12 component files have been created successfully with complete, production-ready code. The application is a SPA (Single Page Application) that uses Zustand for client-side routing and NextAuth for authentication.

## Files Created

### 1. `/home/z/my-project/src/components/app/image-upload.tsx`
- Drag & drop image upload component
- Camera capture for mobile devices
- Preview thumbnail with remove button
- 5MB max size validation, JPG/PNG only
- Uploads to `/api/upload`

### 2. `/home/z/my-project/src/components/app/login-form.tsx`
- Login form with email/password fields
- `signIn` from next-auth/react
- Loading state and error display
- Link to switch to register view
- Emerald-themed design

### 3. `/home/z/my-project/src/components/app/register-form.tsx`
- Registration with name, email, password, confirm password
- Role selector (USER/ADMIN)
- Validation feedback
- Auto-login after registration
- Link to switch to login view

### 4. `/home/z/my-project/src/components/app/app-shell.tsx`
- Responsive sidebar (desktop) / hamburger menu (mobile)
- Role-based navigation items
- User info with role badge
- Logout button
- Notification bell with unread count
- Framer Motion page transitions

### 5. `/home/z/my-project/src/components/app/user-dashboard.tsx`
- Welcome message with stats cards
- Fetches stats from `/api/stats`
- Recent reports list with status badges
- Quick action buttons
- Empty state handling

### 6. `/home/z/my-project/src/components/app/admin-dashboard.tsx`
- Overview stats (total, pending, approved, rejected, users, total amount)
- Pending review section
- Recent activity list
- Filter bar (status, date range)
- Export all data button

### 7. `/home/z/my-project/src/components/app/report-form.tsx`
- Create/Edit expense report
- Dynamic expense items with add/remove
- Categories: Alimentación, Transporte, Alojamiento, Entretenimiento, Oficina, Otro
- Image upload per item
- Running total
- Save as Draft / Submit for Review

### 8. `/home/z/my-project/src/components/app/report-detail.tsx`
- Report header with status badge
- User info and dates
- Items list with image thumbnails
- Admin: Approve/Reject/Request Modification with notes
- User: Edit/Submit buttons (when applicable)
- Export to Excel/PDF

### 9. `/home/z/my-project/src/components/app/reports-list.tsx`
- Filterable list (status, category, date range)
- Desktop table + mobile card views
- Status badges with colors
- Pagination
- Click to view detail

### 10. `/home/z/my-project/src/components/app/notifications-panel.tsx`
- List with unread indicators
- Mark as read / Mark all as read
- Type-based icons (INFO, SUCCESS, WARNING, ERROR)
- Link to related report
- Empty state

### 11. `/home/z/my-project/src/app/page.tsx`
- Session checking with useSession
- View routing based on Zustand store
- SessionProvider + QueryClientProvider wrappers
- Demo data seed button on login page
- Toaster for notifications

### 12. `/home/z/my-project/src/app/layout.tsx`
- Updated with Spanish metadata
- Proper lang="es" attribute
- Clean layout structure

## Design Decisions
- **Color scheme**: Emerald-600 as primary, emerald-50 for light backgrounds
- **Status badges**: DRAFT=gray, SUBMITTED=amber, APPROVED=green, REJECTED=red, MODIFICATION_REQUESTED=orange
- **Mobile-first**: All components responsive with sm/md/lg breakpoints
- **Animations**: Framer Motion for page transitions, card animations
- **State management**: Zustand store for view routing + TanStack Query for server state
- **All text in Spanish** as required

## Lint Status
✅ All lint checks pass cleanly
