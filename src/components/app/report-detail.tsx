'use client'

import { useState } from 'react'
import { useSession } from '@/lib/auth-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileEdit,
  Send,
  Download,
  FileText,
  DollarSign,
  Calendar,
  User,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  PlusCircle,
  Trash2,
  Loader2,
  Paperclip,
  Receipt,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { ImageUpload } from './image-upload'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'Alimentación', label: '🍽️ Alimentación' },
  { value: 'Transporte', label: '🚗 Transporte' },
  { value: 'Alojamiento', label: '🏨 Alojamiento' },
  { value: 'Entretenimiento', label: '🎭 Entretenimiento' },
  { value: 'Oficina', label: '📎 Oficina' },
  { value: 'Otro', label: '📦 Otro' },
]

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  DRAFT: {
    label: 'Borrador',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <FileEdit className="h-4 w-4" />,
    description: 'La rendición está en edición. Puede agregar más gastos.',
  },
  SUBMITTED: {
    label: 'Enviado',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="h-4 w-4" />,
    description: 'Pendiente de revisión por un administrador',
  },
  APPROVED: {
    label: 'Aprobado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: 'La rendición ha sido aprobada',
  },
  REJECTED: {
    label: 'Rechazado',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="h-4 w-4" />,
    description: 'La rendición ha sido rechazada',
  },
  MODIFICATION_REQUESTED: {
    label: 'Modificación Solicitada',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Se han solicitado modificaciones. Puede editar los gastos.',
  },
}

const categoryLabels: Record<string, string> = {
  'Alimentación': 'Alimentación',
  'Transporte': 'Transporte',
  'Alojamiento': 'Alojamiento',
  'Entretenimiento': 'Entretenimiento',
  'Oficina': 'Oficina',
  'Otro': 'Otro',
}

export function ReportDetail() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { selectedReportId, setCurrentView } = useAppStore()
  const [reviewNote, setReviewNote] = useState('')
  const [actionDialog, setActionDialog] = useState<string | null>(null)
  const [isActing, setIsActing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Add item form
  const [showAddForm, setShowAddForm] = useState(false)
  const [itemDescription, setItemDescription] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [itemCategory, setItemCategory] = useState('Alimentación')
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0])
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'
  const userId = session?.user?.id

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', selectedReportId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${selectedReportId}`)
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    enabled: !!selectedReportId,
  })

  const handleStatusChange = async (status: string) => {
    setIsActing(true)
    try {
      const res = await fetch(`/api/reports/${selectedReportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote: reviewNote.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cambiar estado')
      }
      toast.success(
        status === 'APPROVED' ? 'Rendición aprobada' :
        status === 'REJECTED' ? 'Rendición rechazada' :
        'Modificación solicitada'
      )
      queryClient.invalidateQueries({ queryKey: ['report', selectedReportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      setReviewNote('')
      setActionDialog(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la acción')
    } finally {
      setIsActing(false)
    }
  }

  const handleSubmitForReview = async () => {
    try {
      const res = await fetch(`/api/reports/${selectedReportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al enviar')
      }
      toast.success('Rendición enviada para revisión')
      queryClient.invalidateQueries({ queryKey: ['report', selectedReportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la rendición')
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const url = `/api/export/${format}?reportId=${selectedReportId}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `rendicion-${selectedReportId}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(downloadUrl)
      toast.success('Exportación completada')
    } catch {
      toast.error('Error al exportar la rendición')
    }
  }

  // Add new item
  const addItem = async () => {
    if (!itemDescription.trim() || !itemAmount || parseFloat(itemAmount) <= 0) {
      toast.error('Complete descripción y monto')
      return
    }

    setIsAddingItem(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: itemDescription.trim(),
          amount: parseFloat(itemAmount),
          category: itemCategory,
          expenseDate: itemDate,
          imageUrl: itemImageUrl,
          reportId: selectedReportId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al agregar gasto')
      }

      toast.success('Gasto agregado')
      setItemDescription('')
      setItemAmount('')
      setItemCategory('Alimentación')
      setItemDate(new Date().toISOString().split('T')[0])
      setItemImageUrl(null)
      setShowAddForm(false)

      queryClient.invalidateQueries({ queryKey: ['report', selectedReportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el gasto')
    } finally {
      setIsAddingItem(false)
    }
  }

  // Start editing item
  const startEditItem = (item: any) => {
    setEditingItemId(item.id)
    setEditDescription(item.description)
    setEditAmount(item.amount.toString())
    setEditCategory(item.category)
    setEditDate(new Date(item.expenseDate).toISOString().split('T')[0])
    setEditImageUrl(item.imageUrl)
  }

  // Save edited item
  const saveEditItem = async () => {
    if (!editingItemId) return
    setIsUpdatingItem(true)
    try {
      const res = await fetch(`/api/items/${editingItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription.trim(),
          amount: parseFloat(editAmount),
          category: editCategory,
          expenseDate: editDate,
          imageUrl: editImageUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar')
      }
      toast.success('Gasto actualizado')
      setEditingItemId(null)
      queryClient.invalidateQueries({ queryKey: ['report', selectedReportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el gasto')
    } finally {
      setIsUpdatingItem(false)
    }
  }

  // Delete item
  const deleteItem = async (itemId: string) => {
    setIsDeletingItem(itemId)
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      toast.success('Gasto eliminado')
      if (editingItemId === itemId) setEditingItemId(null)
      queryClient.invalidateQueries({ queryKey: ['report', selectedReportId] })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el gasto')
    } finally {
      setIsDeletingItem(null)
    }
  }

  const getCategoryEmoji = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat)
    return found ? found.label.split(' ')[0] : '📦'
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">Rendición no encontrada</p>
      </div>
    )
  }

  const status = statusConfig[report.status] || statusConfig.DRAFT
  const canEdit = !isAdmin && report.userId === userId && ['DRAFT', 'MODIFICATION_REQUESTED'].includes(report.status)
  const canSubmit = !isAdmin && report.userId === userId && ['DRAFT', 'MODIFICATION_REQUESTED'].includes(report.status) && report.items?.length > 0
  const canReview = isAdmin && ['SUBMITTED', 'MODIFICATION_REQUESTED'].includes(report.status)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Image Preview Dialog */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Comprobante</DialogTitle>
            </DialogHeader>
            <img
              src={previewImage}
              alt="Comprobante de gasto"
              className="w-full rounded-lg"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('dashboard')}
          className="h-9 w-9 shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-bold truncate">{report.title}</h2>
            <Badge variant="outline" className={`shrink-0 text-xs ${status.color}`}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{status.description}</p>
        </div>
      </div>

      {/* Report Info */}
      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-3">
          {report.description && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Descripción</span>
              <p className="text-sm mt-0.5">{report.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Solicitante:</span>
              <span className="font-medium">{report.user?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Creado:</span>
              <span className="font-medium">{new Date(report.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
            {report.reviewedAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Revisado:</span>
                <span className="font-medium">{new Date(report.reviewedAt).toLocaleDateString('es-ES')}</span>
              </div>
            )}
          </div>
          {report.reviewNote && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Nota de revisión</span>
              </div>
              <p className="text-sm">{report.reviewNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Items */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              Detalle de Gastos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white border-0">
                {report.items?.length || 0} {report.items?.length === 1 ? 'gasto' : 'gastos'}
              </Badge>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Agregar Gasto
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Item Form (inline) */}
          {canEdit && showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 border-2 border-dashed border-emerald-200 rounded-lg p-4 bg-emerald-50/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                  <PlusCircle className="h-4 w-4" />
                  Nuevo Gasto
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Descripción *</Label>
                  <Input
                    placeholder="Ej: Almuerzo con cliente"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monto *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={itemAmount}
                      onChange={(e) => setItemAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoría *</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha *</Label>
                  <Input
                    type="date"
                    value={itemDate}
                    onChange={(e) => setItemDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Comprobante</Label>
                  <ImageUpload
                    value={itemImageUrl}
                    onChange={setItemImageUrl}
                  />
                </div>
              </div>
              <Button
                onClick={addItem}
                disabled={isAddingItem}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isAddingItem ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Agregar Gasto
              </Button>
            </motion.div>
          )}

          {/* Items List */}
          {report.items?.length === 0 && !showAddForm ? (
            <div className="text-center py-6">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No hay gastos registrados</p>
              {canEdit && (
                <Button
                  variant="link"
                  className="text-emerald-600 mt-1"
                  onClick={() => setShowAddForm(true)}
                >
                  Agregar primer gasto
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {report.items?.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`border rounded-lg p-3 transition-colors ${
                    editingItemId === item.id
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {editingItemId === item.id ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-emerald-700">Editando gasto</span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                            onClick={saveEditItem}
                            disabled={isUpdatingItem}
                          >
                            {isUpdatingItem ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                            onClick={() => setEditingItemId(null)}
                            disabled={isUpdatingItem}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Descripción</Label>
                          <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Monto</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="pl-9" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Categoría</Label>
                          <Select value={editCategory} onValueChange={setEditCategory}>
                            <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Fecha</Label>
                          <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Comprobante</Label>
                          <ImageUpload value={editImageUrl} onChange={setEditImageUrl} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm shrink-0">
                        {getCategoryEmoji(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                                {categoryLabels[item.category] || item.category}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.expenseDate).toLocaleDateString('es-ES')}
                              </span>
                              {item.imageUrl && (
                                <button
                                  onClick={() => setPreviewImage(item.imageUrl)}
                                  className="text-xs text-emerald-600 flex items-center gap-0.5 hover:underline"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  Ver comprobante
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base font-bold text-emerald-700">
                              ${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </span>
                            {canEdit && (
                              <div className="flex gap-0.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => startEditItem(item)}
                                  disabled={isDeletingItem === item.id}
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                  onClick={() => deleteItem(item.id)}
                                  disabled={isDeletingItem === item.id}
                                >
                                  {isDeletingItem === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Total */}
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-bold text-emerald-700">
              ${report.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {canReview && (
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Clock className="h-4 w-4" />
              Revisión de Rendición
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-note" className="text-xs">Nota de revisión (opcional)</Label>
              <Textarea
                id="review-note"
                placeholder="Agregar comentario sobre la revisión..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={actionDialog === 'approve'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogTrigger asChild>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActionDialog('approve')}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Aprobación</DialogTitle>
                    <DialogDescription>
                      ¿Está seguro de que desea aprobar esta rendición por ${report.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleStatusChange('APPROVED')}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar Aprobación
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={actionDialog === 'reject'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setActionDialog('reject')}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Rechazo</DialogTitle>
                    <DialogDescription>
                      ¿Está seguro de que desea rechazar esta rendición? Esta acción notificará al solicitante.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange('REJECTED')}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Confirmar Rechazo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={actionDialog === 'modify'} onOpenChange={(open) => !open && setActionDialog(null)}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => setActionDialog('modify')}
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Solicitar Modificación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar Modificación</DialogTitle>
                    <DialogDescription>
                      Se notificará al solicitante que debe realizar cambios en su rendición.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setActionDialog(null)}>Cancelar</Button>
                    <Button
                      variant="outline"
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                      onClick={() => handleStatusChange('MODIFICATION_REQUESTED')}
                      disabled={isActing}
                    >
                      {isActing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Solicitar Modificación
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Actions */}
      {(canEdit || canSubmit) && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {canEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentView('edit-report')}
                >
                  <FileEdit className="mr-2 h-4 w-4" />
                  Editar Rendición Completa
                </Button>
              )}
              {canSubmit && (
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSubmitForReview}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Revisión
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 shadow-sm"
              onClick={() => handleExport('excel')}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar a Excel
            </Button>
            <Button
              variant="outline"
              className="flex-1 shadow-sm"
              onClick={() => handleExport('pdf')}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar a PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
