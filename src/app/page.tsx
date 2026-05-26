'use client'

import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { useAppStore } from '@/lib/store'
import { LoginForm } from '@/components/app/login-form'
import { RegisterForm } from '@/components/app/register-form'
import { AppShell } from '@/components/app/app-shell'
import { AdminDashboard } from '@/components/app/admin-dashboard'
import { ReportForm } from '@/components/app/report-form'
import { ReportDetail } from '@/components/app/report-detail'
import { ReportsList } from '@/components/app/reports-list'
import { NotificationsPanel } from '@/components/app/notifications-panel'
import { UsersPanel } from '@/components/app/users-panel'
import { UserProfile } from '@/components/app/user-profile'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'
import { useState } from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
})

function AppContent() {
  const { session, status } = useAuth()
  const { currentView, setCurrentView } = useAppStore()
  const [seeding, setSeeding] = useState(false)

  // When session becomes authenticated, navigate to the correct dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role
      if (currentView === 'login' || currentView === 'register') {
        setCurrentView(role === 'ADMIN' ? 'admin-dashboard' : 'dashboard')
      }
    }
  }, [status, session, currentView, setCurrentView])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear datos')
      }
      alert(
        'Datos de demostración creados!\n\n' +
        'Credenciales:\n' +
        '• Admin: admin@empresa.com / password123\n' +
        '• Usuario: maria@empresa.com / password123\n' +
        '• Usuario: carlos@empresa.com / password123'
      )
    } catch (err: any) {
      alert(err.message || 'Error al crear datos de demostración')
    } finally {
      setSeeding(false)
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - show login/register
  if (status === 'unauthenticated') {
    return (
      <div className="relative">
        {currentView === 'register' ? <RegisterForm /> : <LoginForm />}
        {/* Seed button */}
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeed}
            disabled={seeding}
            className="shadow-lg bg-white/90 backdrop-blur-sm text-xs"
          >
            {seeding ? (
              <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            ) : (
              <Database className="mr-1.5 h-3 w-3" />
            )}
            Cargar datos de demostración
          </Button>
        </div>
      </div>
    )
  }

  // Authenticated - render appropriate view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <ReportsList />
      case 'admin-dashboard':
        return <AdminDashboard />
      case 'create-report':
        return <ReportForm />
      case 'edit-report':
        return <ReportForm />
      case 'report-detail':
        return <ReportDetail />
      case 'notifications':
        return <NotificationsPanel />
      case 'users':
        return <UsersPanel />
      case 'profile':
        return <UserProfile />
      default:
        return <ReportsList />
    }
  }

  return (
    <AppShell>
      {renderView()}
    </AppShell>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </AuthProvider>
  )
}
