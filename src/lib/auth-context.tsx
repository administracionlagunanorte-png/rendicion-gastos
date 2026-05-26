'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Session {
  user: User | null
  expires?: string
}

interface AuthContextType {
  session: Session | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  status: 'loading',
  login: async () => ({ success: false }),
  logout: async () => {},
  refreshSession: async () => {},
})

// Minimum time between session refreshes (5 seconds)
const REFRESH_COOLDOWN_MS = 5000

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const lastRefreshRef = useRef<number>(0)
  const loginTimeRef = useRef<number>(0)

  const refreshSession = useCallback(async () => {
    // Cooldown: don't refresh too frequently
    const now = Date.now()
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) {
      return
    }
    lastRefreshRef.current = now

    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setSession({ user: data.user, expires: data.expires })
          setStatus('authenticated')
          return
        }
      }

      // Only set to unauthenticated if we're NOT in the grace period after login
      // This prevents race conditions where refreshSession runs before the cookie is fully set
      if (Date.now() - loginTimeRef.current > 3000) {
        setSession({ user: null })
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('[AuthProvider] refreshSession error:', error)
      // Don't logout on network errors - could be temporary
      if (Date.now() - loginTimeRef.current > 3000) {
        setSession({ user: null })
        setStatus('unauthenticated')
      }
    }
  }, [])

  // Check session on mount
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Refresh session on window focus (but with cooldown)
  useEffect(() => {
    const handleFocus = () => {
      if (status === 'authenticated') {
        refreshSession()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [status, refreshSession])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      loginTimeRef.current = Date.now()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Error al iniciar sesión.' }
      }

      if (data.success && data.user) {
        // Set session immediately from login response
        setSession({
          user: data.user,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        setStatus('authenticated')

        // Verify the cookie was actually set by checking /api/auth/me
        // This is done asynchronously - if it fails, we'll still show the dashboard
        // from the login response data, and the next refresh will fix it
        setTimeout(async () => {
          try {
            const verifyRes = await fetch('/api/auth/me', {
              method: 'GET',
              credentials: 'include',
            })
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              if (verifyData.user) {
                // Cookie is working - update session with server data
                setSession({ user: verifyData.user, expires: verifyData.expires })
              }
            } else {
              // Cookie might not be set - log warning but don't logout
              console.warn('[AuthProvider] Post-login cookie verification failed - session may not persist after refresh')
            }
          } catch (e) {
            console.warn('[AuthProvider] Post-login verification error:', e)
          }
        }, 500)

        return { success: true }
      }

      return { success: false, error: 'No se pudo iniciar sesión.' }
    } catch (error) {
      console.error('[AuthProvider] login error:', error)
      return { success: false, error: 'Error de conexión. Intente nuevamente.' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('[AuthProvider] logout error:', error)
    } finally {
      setSession({ user: null })
      setStatus('unauthenticated')
      loginTimeRef.current = 0
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, status, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Compatibility hook that mimics useSession() interface from next-auth
// Returns { data: session, status } so components can migrate with minimal changes
export function useSession() {
  const { session, status } = useAuth()
  return {
    data: session,
    status,
    update: async () => {},
  }
}

// Compatibility signOut function that mimics next-auth's signOut
export async function signOut(options?: { redirect?: boolean; callbackUrl?: string }) {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('[Auth] signOut error:', error)
  }

  // Force a full page reload to clear all state
  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl
  } else {
    window.location.href = '/'
  }
}
