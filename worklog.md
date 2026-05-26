---
Task ID: 1
Agent: Main Agent
Task: Fix login session persistence issue - USER login kicks user out of system

Work Log:
- Read all auth-related files to understand current state
- Identified root cause: getServerSession(authOptions) from next-auth doesn't work reliably behind Caddy reverse proxy
- Created new `getAuthSession()` helper in `/src/lib/auth-helper.ts` that uses `decode()` from `next-auth/jwt` to read session directly from cookie
- Replaced `getServerSession` with `getAuthSession` in all 8 API route files:
  - `/api/reports/route.ts`
  - `/api/reports/[id]/route.ts`
  - `/api/notifications/route.ts`
  - `/api/notifications/[id]/route.ts`
  - `/api/notifications/mark-all-read/route.ts`
  - `/api/stats/route.ts`
  - `/api/items/route.ts`
  - `/api/items/[id]/route.ts`
- Updated auth-context.tsx with:
  - Cooldown between session refreshes (5 seconds) to prevent race conditions
  - Grace period after login (3 seconds) where refreshSession won't set status to unauthenticated
  - Post-login cookie verification (async, 500ms delay) to ensure cookie was set
  - Network error tolerance - don't logout on temporary network failures
- Added NEXTAUTH_SECRET to .env for consistency across all auth operations
- Built and restarted the server
- Tested complete flow for all scenarios:
  - USER login (maria@empresa.com) - ✅
  - USER login (carlos@empresa.com) - ✅
  - ADMIN login (admin@empresa.com) - ✅
  - Session verification after login - ✅
  - Reports API with session - ✅
  - Stats API with session - ✅
  - Notifications API with session - ✅
  - Login/Logout/Login cycle - ✅
  - Wrong password rejection - ✅
  - All tests through Caddy proxy (port 81) - ✅

Stage Summary:
- All authentication issues resolved
- Custom `getAuthSession()` bypasses NextAuth's getServerSession which fails behind proxy
- Auth context now has proper race condition protection
- Both USER and ADMIN login work correctly
- Server is running and ready at port 3000 (proxy at 81)
