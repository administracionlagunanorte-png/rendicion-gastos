'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Download,
  AlertTriangle,
  FileEdit,
  TrendingUp,
  Eye,
  PlusCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <FileEdit className="h-3 w-3" /> },
  SUBMITTED: { label: 'Enviado', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: 'Aprobado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: 'Rechazado', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
  MODIFICATION_REQUESTED: { label: 'Modificación', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: <AlertTriangle className="h-3 w-3" /> },
}

export function AdminDashboard() {
  const { filters, setFilters, resetFilters, setCurrentView } = useAppStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/stats')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['pending-reports'],
    queryFn: async () => {
      const res = await apiFetch('/api/reports?status=SUBMITTED&pageSize=10')
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const handleExportAll = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.userId) params.set('userId', filters.userId)
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.set('dateTo', filters.dateTo)

      const url = `/api/export/excel?${params.toString()}`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = 'rendiciones.xlsx'
      a.click()
      URL.revokeObjectURL(downloadUrl)
      toast.success('Exportación completada')
    } catch {
      toast.error('Error al exportar los datos')
    }
  }

  const statCards = [
    {
      title: 'Total Rendiciones',
      value: stats?.totalReports ?? 0,
      icon: <FileText className="h-5 w-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Pendientes Revisión',
      value: stats?.pendingReports ?? 0,
      icon: <Clock className="h-5 w-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Aprobadas',
      value: stats?.approvedReports ?? 0,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Rechazadas',
      value: stats?.rejectedReports ?? 0,
      icon: <XCircle className="h-5 w-5" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Usuarios',
      value: stats?.totalUsers ?? 0,
      icon: <Users className="h-5 w-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Monto Aprobado',
      value: `$${(stats?.totalAmountApproved ?? 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Panel de Administración</h2>
          <p className="text-muted-foreground mt-1">Gestiona y revisa todas las rendiciones de gastos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setCurrentView('create-report')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva Rendición
          </Button>
          <Button
            onClick={handleExportAll}
            variant="outline"
            className="shadow-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Todo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {statsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-14" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                      <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                        <span className={stat.color}>{stat.icon}</span>
                      </div>
                    </div>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-xs">Estado</Label>
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ status: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="SUBMITTED">Enviado</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                  <SelectItem value="REJECTED">Rechazado</SelectItem>
                  <SelectItem value="MODIFICATION_REQUESTED">Modificación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input
                type="date"
                className="h-9 text-xs w-[140px]"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ dateFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input
                type="date"
                className="h-9 text-xs w-[140px]"
                value={filters.dateTo}
                onChange={(e) => setFilters({ dateTo: e.target.value })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Review Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Pendientes de Revisión</CardTitle>
              {stats?.pendingReports > 0 && (
                <Badge className="bg-amber-500 text-white border-0 text-[10px]">
                  {stats.pendingReports}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 text-xs"
              onClick={() => {
                setFilters({ status: 'SUBMITTED' })
                setCurrentView('dashboard')
              }}
            >
              Ver todas <TrendingUp className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ) : pendingData?.reports?.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-300 mb-2" />
              <p className="text-sm text-muted-foreground">No hay rendiciones pendientes de revisión</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingData?.reports?.map((report: any) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-emerald-100"
                  onClick={() => {
                    useAppStore.getState().setSelectedReportId(report.id)
                    setCurrentView('report-detail')
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.user?.name} · {new Date(report.createdAt).toLocaleDateString('es-ES')} · ${report.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-emerald-600">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : stats?.recentReports?.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentReports?.map((report: any) => {
                const status = statusConfig[report.status] || statusConfig.DRAFT
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      useAppStore.getState().setSelectedReportId(report.id)
                      setCurrentView('report-detail')
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.user?.name} · {new Date(report.createdAt).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ml-2 shrink-0 ${status.color}`}>
                      {status.icon}
                      <span className="ml-1">{status.label}</span>
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
