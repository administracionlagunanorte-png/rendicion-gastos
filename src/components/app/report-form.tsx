'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-context'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Send,
  PlusCircle,
  Trash2,
  Loader2,
  ArrowLeft,
  DollarSign,
  FileText,
  Check,
  X,
  Edit3,
  Receipt,
  Paperclip,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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

interface SavedItem {
  id: string
  description: string
  amount: number
  category: string
  expenseDate: string
  imageUrl: string | null
  compraImageUrl: string | null
}

export function ReportForm() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const { selectedReportId, setCurrentView, setSelectedReportId } = useAppStore()
  const isEditing = !!selectedReportId

  // Report info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [montoRendir, setMontoRendir] = useState('')
  const [numeroBoleta, setNumeroBoleta] = useState('')
  const [reportSaved, setReportSaved] = useState(false)
  const [reportId, setReportId] = useState<string | null>(selectedReportId)

  // New expense item form
  const [itemDescription, setItemDescription] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [itemCategory, setItemCategory] = useState('Alimentación')
  const [itemDate, setItemDate] = useState(new Date().toISOString().split('T')[0])
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null)
  const [itemCompraImageUrl, setItemCompraImageUrl] = useState<string | null>(null)
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({})

  // Saved items (from backend)
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])

  // Editing existing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null)
  const [editCompraImageUrl, setEditCompraImageUrl] = useState<string | null>(null)

  // Loading states
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [isUpdatingItem, setIsUpdatingItem] = useState(false)
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load existing report if editing
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', selectedReportId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${selectedReportId}`)
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
    enabled: isEditing,
  })

  useEffect(() => {
    if (report) {
      setTitle(report.title)
      setDescription(report.description || '')
      setMontoRendir(report.montoRendir ? report.montoRendir.toString() : '')
      setNumeroBoleta(report.numeroBoleta || '')
      setReportId(report.id)
      setReportSaved(true)
      setSavedItems(
        report.items.map((item: any) => ({
          id: item.id,
          description: item.description,
          amount: item.amount,
          category: item.category,
          expenseDate: new Date(item.expenseDate).toISOString().split('T')[0],
          imageUrl: item.imageUrl,
          compraImageUrl: item.compraImageUrl,
        }))
      )
    }
  }, [report])

  const totalAmount = savedItems.reduce((sum, item) => sum + item.amount, 0)

  // Save or update report header info
  const saveReport = async () => {
    if (!title.trim()) {
      toast.error('El título es requerido')
      return
    }
    if (!montoRendir || parseFloat(montoRendir) <= 0) {
      toast.error('El monto a rendir es obligatorio')
      return
    }
    if (!numeroBoleta.trim()) {
      toast.error('El número de boleta es obligatorio')
      return
    }

    setIsSavingReport(true)
    try {
      const reportData: any = {
        title: title.trim(),
        description: description.trim() || null,
        montoRendir: parseFloat(montoRendir),
        numeroBoleta: numeroBoleta.trim(),
      }

      let res: Response
      if (!reportId) {
        res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        })
      } else {
        res = await fetch(`/api/reports/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      const savedReport = await res.json()
      setReportId(savedReport.id)
      setSelectedReportId(savedReport.id)
      setReportSaved(true)
      toast.success('Rendición guardada')
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la rendición')
    } finally {
      setIsSavingReport(false)
    }
  }

  // Validate new item
  const validateItem = (): boolean => {
    const errors: Record<string, string> = {}
    if (!itemDescription.trim()) errors.description = 'Requerido'
    if (!itemAmount || parseFloat(itemAmount) <= 0) errors.amount = 'Monto inválido'
    if (!itemCategory) errors.category = 'Requerido'
    if (!itemDate) errors.date = 'Requerido'
    if (!itemImageUrl) errors.image = 'La foto de la boleta es obligatoria'
    if (!itemCompraImageUrl) errors.compraImage = 'La foto de la compra es obligatoria'
    setItemErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add a new expense item
  const addItem = async () => {
    if (!validateItem()) return

    if (!reportId) {
      toast.error('Primero guarde la rendición')
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
          compraImageUrl: itemCompraImageUrl,
          reportId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al agregar gasto')
      }

      const savedItem = await res.json()

      setSavedItems(prev => [...prev, {
        id: savedItem.id,
        description: savedItem.description,
        amount: savedItem.amount,
        category: savedItem.category,
        expenseDate: new Date(savedItem.expenseDate).toISOString().split('T')[0],
        imageUrl: savedItem.imageUrl,
        compraImageUrl: savedItem.compraImageUrl,
      }])

      // Reset form
      setItemDescription('')
      setItemAmount('')
      setItemCategory('Alimentación')
      setItemDate(new Date().toISOString().split('T')[0])
      setItemImageUrl(null)
      setItemCompraImageUrl(null)
      setItemErrors({})

      toast.success('Gasto agregado')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el gasto')
    } finally {
      setIsAddingItem(false)
    }
  }

  // Start editing an item
  const startEditItem = (item: SavedItem) => {
    setEditingItemId(item.id)
    setEditDescription(item.description)
    setEditAmount(item.amount.toString())
    setEditCategory(item.category)
    setEditDate(item.expenseDate)
    setEditImageUrl(item.imageUrl)
    setEditCompraImageUrl(item.compraImageUrl)
  }

  // Save edited item
  const saveEditItem = async () => {
    if (!editingItemId) return
    if (!editDescription.trim() || !editAmount || parseFloat(editAmount) <= 0) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    if (!editImageUrl) {
      toast.error('La foto de la boleta es obligatoria')
      return
    }
    if (!editCompraImageUrl) {
      toast.error('La foto de la compra es obligatoria')
      return
    }

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
          compraImageUrl: editCompraImageUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar gasto')
      }

      const updatedItem = await res.json()

      setSavedItems(prev => prev.map(item =>
        item.id === editingItemId
          ? {
              ...item,
              description: updatedItem.description,
              amount: updatedItem.amount,
              category: updatedItem.category,
              expenseDate: new Date(updatedItem.expenseDate).toISOString().split('T')[0],
              imageUrl: updatedItem.imageUrl,
              compraImageUrl: updatedItem.compraImageUrl,
            }
          : item
      ))

      setEditingItemId(null)
      toast.success('Gasto actualizado')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el gasto')
    } finally {
      setIsUpdatingItem(false)
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingItemId(null)
  }

  // Delete an item
  const deleteItem = async (itemId: string) => {
    setIsDeletingItem(itemId)
    try {
      const res = await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar gasto')
      }

      setSavedItems(prev => prev.filter(item => item.id !== itemId))
      if (editingItemId === itemId) setEditingItemId(null)
      toast.success('Gasto eliminado')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el gasto')
    } finally {
      setIsDeletingItem(null)
    }
  }

  // Submit for review
  const submitForReview = async () => {
    if (!reportId) return
    if (savedItems.length === 0) {
      toast.error('Debe agregar al menos un gasto para enviar')
      return
    }
    // Verificar que todos los items tengan ambas fotos
    const itemsWithoutBoleta = savedItems.filter(item => !item.imageUrl)
    const itemsWithoutCompra = savedItems.filter(item => !item.compraImageUrl)
    if (itemsWithoutBoleta.length > 0 || itemsWithoutCompra.length > 0) {
      const faltantes = itemsWithoutBoleta.length + itemsWithoutCompra.length
      toast.error(`Todos los gastos deben tener foto de boleta y foto de compra. Faltan ${faltantes} foto(s).`)
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al enviar')
      }
      toast.success('Rendición enviada para revisión')
      setCurrentView('report-detail')
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al enviar la rendición')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getCategoryEmoji = (cat: string) => {
    const found = CATEGORIES.find(c => c.value === cat)
    return found ? found.label.split(' ')[0] : '📦'
  }

  if (isEditing && reportLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (isEditing) {
              setCurrentView('report-detail')
            } else {
              setCurrentView('dashboard')
            }
          }}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            {isEditing ? 'Editar Rendición' : 'Nueva Rendición'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Agregue, edite o elimine gastos de la rendición' : 'Cree la rendición y agregue gastos uno por uno'}
          </p>
        </div>
      </div>

      {/* Step 1: Report Info */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Información de la Rendición
              {reportSaved && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] ml-1">
                  <Check className="h-3 w-3 mr-0.5" />
                  Guardada
                </Badge>
              )}
            </CardTitle>
            {!reportSaved && (
              <Button
                size="sm"
                onClick={saveReport}
                disabled={isSavingReport || !title.trim() || !montoRendir || !numeroBoleta.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSavingReport ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Guardar
              </Button>
            )}
            {reportSaved && (
              <Button
                size="sm"
                variant="outline"
                onClick={saveReport}
                disabled={isSavingReport}
                className="text-xs"
              >
                {isSavingReport ? <Loader2 className="h-3 w-3 animate-spin" /> : <Edit3 className="h-3 w-3 mr-1" />}
                Editar Info
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-title">Título *</Label>
            <Input
              id="report-title"
              placeholder="Ej: Viaje de negocios - Madrid"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              disabled={!reportSaved ? false : false}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-desc">Descripción</Label>
            <Textarea
              id="report-desc"
              placeholder="Descripción opcional del reporte..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto-rendir">Monto a Rendir *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="monto-rendir"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={montoRendir}
                  onChange={(e) => setMontoRendir(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-[10px] text-red-500">Campo obligatorio</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero-boleta">Número de Boleta *</Label>
              <Input
                id="numero-boleta"
                placeholder="Ej: 12345"
                value={numeroBoleta}
                onChange={(e) => setNumeroBoleta(e.target.value)}
              />
              <p className="text-[10px] text-red-500">Campo obligatorio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Add Expense Items */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-600" />
              Gastos
              {savedItems.length > 0 && (
                <Badge className="bg-emerald-600 text-white border-0 text-[10px]">
                  {savedItems.length} {savedItems.length === 1 ? 'gasto' : 'gastos'}
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Saved Items List */}
          <AnimatePresence>
            {savedItems.length > 0 && (
              <div className="space-y-2">
                {savedItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
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
                              onClick={cancelEdit}
                              disabled={isUpdatingItem}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Descripción *</Label>
                            <Input
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Descripción del gasto"
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
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Categoría *</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
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
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Foto de la Boleta *</Label>
                            <ImageUpload
                              value={editImageUrl}
                              onChange={setEditImageUrl}
                              required={true}
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Foto de la Compra *</Label>
                            <ImageUpload
                              value={editCompraImageUrl}
                              onChange={setEditCompraImageUrl}
                              required={true}
                            />
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
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground">{item.category}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {new Date(item.expenseDate).toLocaleDateString('es-ES')}
                                </span>
                                {item.imageUrl && (
                                  <span className="text-[11px] text-emerald-600 flex items-center gap-0.5">
                                    <Paperclip className="h-2.5 w-2.5" />
                                    Boleta
                                  </span>
                                )}
                                {item.compraImageUrl && (
                                  <span className="text-[11px] text-blue-600 flex items-center gap-0.5">
                                    <Paperclip className="h-2.5 w-2.5" />
                                    Compra
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-bold text-emerald-700">
                                ${item.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                              </span>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {savedItems.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed rounded-lg border-muted">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No hay gastos agregados aún</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Complete el formulario debajo para agregar gastos</p>
            </div>
          )}

          {/* Total */}
          {savedItems.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between px-1">
                <span className="text-sm font-semibold">Total de Gastos</span>
                <span className="text-2xl font-bold text-emerald-700">
                  ${totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {montoRendir && parseFloat(montoRendir) > 0 && (
                <div className="space-y-1 px-1">
                  <div className="flex items-center justify-between pt-1 border-t border-dashed">
                    <span className="text-sm text-muted-foreground">Monto a Rendir</span>
                    <span className="text-lg font-bold text-blue-700">
                      ${parseFloat(montoRendir).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {(parseFloat(montoRendir) - totalAmount) !== 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">
                        {parseFloat(montoRendir) > totalAmount ? 'Sobrante' : 'Diferencia'}
                      </span>
                      <span className={`text-xs font-bold ${parseFloat(montoRendir) > totalAmount ? 'text-amber-600' : 'text-red-600'}`}>
                        ${Math.abs(parseFloat(montoRendir) - totalAmount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <Separator />

          {/* Add New Item Form */}
          <div className="border-2 border-dashed border-emerald-200 rounded-lg p-4 bg-emerald-50/30 space-y-3">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Agregar Nuevo Gasto</span>
            </div>

            {!reportId ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Primero guarde la rendición para poder agregar gastos
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Descripción del gasto *</Label>
                    <Input
                      placeholder="Ej: Almuerzo con cliente"
                      value={itemDescription}
                      onChange={(e) => {
                        setItemDescription(e.target.value)
                        if (itemErrors.description) setItemErrors(prev => ({ ...prev, description: '' }))
                      }}
                      className={itemErrors.description ? 'border-red-300' : ''}
                    />
                    {itemErrors.description && <p className="text-[10px] text-red-500">{itemErrors.description}</p>}
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
                        onChange={(e) => {
                          setItemAmount(e.target.value)
                          if (itemErrors.amount) setItemErrors(prev => ({ ...prev, amount: '' }))
                        }}
                        className={`pl-9 ${itemErrors.amount ? 'border-red-300' : ''}`}
                      />
                    </div>
                    {itemErrors.amount && <p className="text-[10px] text-red-500">{itemErrors.amount}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Categoría *</Label>
                    <Select
                      value={itemCategory}
                      onValueChange={(v) => {
                        setItemCategory(v)
                        if (itemErrors.category) setItemErrors(prev => ({ ...prev, category: '' }))
                      }}
                    >
                      <SelectTrigger className={`text-xs ${itemErrors.category ? 'border-red-300' : ''}`}>
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
                    <Label className="text-xs">Fecha del gasto *</Label>
                    <Input
                      type="date"
                      value={itemDate}
                      onChange={(e) => {
                        setItemDate(e.target.value)
                        if (itemErrors.date) setItemErrors(prev => ({ ...prev, date: '' }))
                      }}
                      className={itemErrors.date ? 'border-red-300' : ''}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Foto de la Boleta *</Label>
                    <ImageUpload
                      value={itemImageUrl}
                      onChange={(url) => {
                        setItemImageUrl(url)
                        if (itemErrors.image) setItemErrors(prev => ({ ...prev, image: '' }))
                      }}
                      required={true}
                    />
                    {itemErrors.image && <p className="text-[10px] text-red-500">{itemErrors.image}</p>}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Foto de la Compra *</Label>
                    <ImageUpload
                      value={itemCompraImageUrl}
                      onChange={(url) => {
                        setItemCompraImageUrl(url)
                        if (itemErrors.compraImage) setItemErrors(prev => ({ ...prev, compraImage: '' }))
                      }}
                      required={true}
                    />
                    {itemErrors.compraImage && <p className="text-[10px] text-red-500">{itemErrors.compraImage}</p>}
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
                  Agregar Gasto a la Rendición
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pb-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentView('dashboard')}
          className="flex-1 shadow-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Rendiciones
        </Button>
        {reportSaved && (
          <Button
            type="button"
            onClick={submitForReview}
            disabled={isSubmitting || savedItems.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar para Revisión
          </Button>
        )}
      </div>
    </div>
  )
}
