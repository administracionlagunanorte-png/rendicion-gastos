'use client'

import { useState, useEffect } from 'react'
import { formatCLP } from '@/lib/format-currency'
import { ImageUpload } from './image-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, DollarSign, Receipt } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'Alimentación', label: 'Alimentación' },
  { value: 'Transporte', label: 'Transporte' },
  { value: 'Alojamiento', label: 'Alojamiento' },
  { value: 'Entretenimiento', label: 'Entretenimiento' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Capacitación', label: 'Capacitación' },
  { value: 'Otro', label: 'Otro' },
]

interface ExpenseItemData {
  id?: string
  description: string
  amount: string
  numeroBoleta: string
  montoRendir: string
  category: string
  expenseDate: string
  imageBoletaUrl: string | null
  imageCompraUrl: string | null
}

interface ExpenseItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ExpenseItemData | null
  reportId: string
  onSave: () => void
}

export function ExpenseItemDialog({ open, onOpenChange, item, reportId, onSave }: ExpenseItemDialogProps) {
  const [form, setForm] = useState<ExpenseItemData>({
    description: '',
    amount: '',
    numeroBoleta: '',
    montoRendir: '',
    category: 'Alimentación',
    expenseDate: new Date().toISOString().split('T')[0],
    imageBoletaUrl: null,
    imageCompraUrl: null,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        description: item.description || '',
        amount: item.amount || '',
        numeroBoleta: item.numeroBoleta || '',
        montoRendir: item.montoRendir || '',
        category: item.category || 'Alimentación',
        expenseDate: item.expenseDate || new Date().toISOString().split('T')[0],
        imageBoletaUrl: item.imageBoletaUrl || null,
        imageCompraUrl: item.imageCompraUrl || null,
      })
    } else {
      setForm({
        description: '',
        amount: '',
        numeroBoleta: '',
        montoRendir: '',
        category: 'Alimentación',
        expenseDate: new Date().toISOString().split('T')[0],
        imageBoletaUrl: null,
        imageCompraUrl: null,
      })
    }
  }, [item, open])

  const updateField = (field: keyof ExpenseItemData, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = (): string | null => {
    if (!form.description.trim()) return 'La descripción es requerida'
    if (!form.amount || parseFloat(form.amount) <= 0) return 'El monto debe ser mayor a 0'
    if (!form.numeroBoleta.trim()) return 'El número de boleta es requerido'
    if (!form.montoRendir || parseFloat(form.montoRendir) <= 0) return 'El monto a rendir debe ser mayor a 0'
    if (!form.category) return 'La categoría es requerida'
    if (!form.expenseDate) return 'La fecha es requerida'
    if (!form.imageBoletaUrl) return 'La foto de la boleta es requerida'
    if (!form.imageCompraUrl) return 'La foto de la compra es requerida'
    return null
  }

  const handleSave = async () => {
    const error = validate()
    if (error) {
      toast.error(error)
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        numeroBoleta: form.numeroBoleta.trim(),
        montoRendir: parseFloat(form.montoRendir),
        category: form.category,
        expenseDate: form.expenseDate,
        imageBoletaUrl: form.imageBoletaUrl,
        imageCompraUrl: form.imageCompraUrl,
        reportId,
      }

      if (item?.id) {
        // Update existing item
        const res = await fetch(`/api/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al actualizar gasto')
        }
        toast.success('Gasto actualizado correctamente')
      } else {
        // Create new item
        const res = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al agregar gasto')
        }
        toast.success('Gasto agregado correctamente')
      }

      onSave()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar el gasto')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item?.id ? 'Editar Gasto' : 'Agregar Gasto'}
          </DialogTitle>
          <DialogDescription>
            {item?.id ? 'Modifique los datos del gasto' : 'Complete los datos del nuevo gasto'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs">Descripción *</Label>
            <Input
              placeholder="Descripción del gasto"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Monto *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                Número de Boleta *
              </Label>
              <Input
                placeholder="Ej: 12345"
                value={form.numeroBoleta}
                onChange={(e) => updateField('numeroBoleta', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monto a Rendir *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                  value={form.montoRendir}
                  onChange={(e) => updateField('montoRendir', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Categoría *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField('category', v)}
              >
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
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Fecha *</Label>
            <Input
              type="date"
              value={form.expenseDate}
              onChange={(e) => updateField('expenseDate', e.target.value)}
            />
          </div>

          {/* Photo uploads */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Receipt className="h-3 w-3" />
                Foto de la Boleta *
              </Label>
              <ImageUpload
                value={form.imageBoletaUrl}
                onChange={(url) => updateField('imageBoletaUrl', url)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-blue-700 flex items-center gap-1">
                Foto de la Compra *
              </Label>
              <ImageUpload
                value={form.imageCompraUrl}
                onChange={(url) => updateField('imageCompraUrl', url)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {item?.id ? 'Guardar Cambios' : 'Agregar Gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
