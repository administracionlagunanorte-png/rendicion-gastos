import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
    }
  }
  interface User {
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials")
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            console.log("[Auth] User not found:", credentials.email)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            console.log("[Auth] Invalid password for:", credentials.email)
            return null
          }

          console.log("[Auth] Login successful:", credentials.email, "Role:", user.role)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        } catch (error) {
          console.error("[Auth] Authorization error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // When behind a reverse proxy, baseUrl might be wrong (localhost:3000)
      // The NEXTAUTH_URL is set dynamically in the route handler
      // So baseUrl should now be correct
      
      // If url is relative, prepend baseUrl
      if (url.startsWith("/")) return baseUrl + url
      
      // If url is on same origin as baseUrl, allow it
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url
      } catch {}
      
      // If url points to localhost:3000 (internal), replace with baseUrl
      try {
        const urlObj = new URL(url)
        const baseObj = new URL(baseUrl)
        if (urlObj.hostname === 'localhost' && urlObj.port === '3000') {
          return baseObj.origin + urlObj.pathname + urlObj.search
        }
      } catch {}
      
      console.log("[Auth] Redirect: url=", url, "baseUrl=", baseUrl)
      return url
    }
  },
  pages: {
    signIn: '/'
  },
  secret: process.env.NEXTAUTH_SECRET || "expense-app-secret-key-2024",
  // Trust the reverse proxy so NextAuth uses X-Forwarded-Host/Proto headers
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Don't set secure flag since we may be accessed via HTTP in development
        // The browser will handle this appropriately
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
}
