---
Task ID: 1
Agent: Main Agent
Task: Fix login authentication system that was broken behind reverse proxy

Work Log:
- Analyzed all authentication-related files (NextAuth config, custom login endpoint, login form, middleware, Caddyfile)
- Discovered that NextAuth's useSession() was failing behind the Caddy reverse proxy because:
  1. NextAuth's /api/auth/session endpoint set callback-url cookie to http://localhost:3000 instead of the proxy URL
  2. The SessionProvider/useSession() hook relied on NextAuth's session endpoint which had proxy issues
  3. The custom login endpoint (/api/auth/login) worked perfectly via curl but the session wasn't detected by NextAuth's client-side code
- Created a completely custom authentication system that bypasses NextAuth's client-side session management:
  1. Created /api/auth/me endpoint - reads session cookie directly, returns user data
  2. Created /api/auth/logout endpoint - clears session cookie
  3. Created custom AuthProvider and useAuth() hook in src/lib/auth-context.tsx
  4. Replaced SessionProvider with AuthProvider in src/app/page.tsx
  5. Updated all components to use custom useAuth()/useSession() instead of next-auth/react
- Fixed case-insensitive email lookup for SQLite (admin@empresa.com vs ADMIN@EMPRESA.COM)
- Tested extensively with curl and Playwright browser automation
- All tests passed: Login, Session Persistence, Logout, Wrong Password handling

Stage Summary:
- Custom auth system works 100% through both direct access and proxy
- NextAuth's server-side getServerSession() still works for API routes (unchanged)
- Client-side session management is now fully custom, independent of NextAuth's SessionProvider
- Credentials: admin@empresa.com / password123 (ADMIN), maria@empresa.com / password123 (USER)
