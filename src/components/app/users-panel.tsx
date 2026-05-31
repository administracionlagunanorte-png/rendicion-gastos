'use client'

import { useState } from 'react'
import { formatCLP } from '@/lib/format-currency'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Shield,
  User,
  Loader2,
  X,
  FileText,
  Trash2,
  Pencil,
  DollarSign,
  Check,
  AlertTriangle,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export function UsersPanel() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showBudgetDialog, setShowBudgetDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // Create user form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('USER')
  const [newMontoAsignado, setNewMontoAsignado] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Budget form state
  const [budgetAmount, setBudgetAmount] = useState('')
  const [isSavingBudget, setIsSavingBudget] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('USER')
  const [isEditing, setIsEditing] = useState(false)

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      params.set('withBudget', 'true')
      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) throw new Error('Error')
      return res.json()
    },
  })

  const handleCreateUser = async () => {
    if (!newName.trim()) { toast.error('El nombre es requerido'); return }
    if (!newEmail.trim()) { toast.error('El email es requerido'); return }
    if (!newPassword || newPassword.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }

    setIsCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          montoAsignado: newMontoAsignado || '0',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear usuario')
      }
      toast.success(`Usuario "${newName.trim()}" creado exitosamente`)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRole('USER')
      setNewMontoAsignado('')
      setShowCreateDialog(false)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el usuario')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSaveBudget = async () => {
    if (!selectedUser) return
    setIsSavingBudget(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoAsignado: budgetAmount }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar presupuesto')
      }
      toast.success('Presupuesto actualizado correctamente')
      setShowBudgetDialog(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar presupuesto')
    } finally {
      setIsSavingBudget(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return
    if (!editName.trim()) { toast.error('El nombre es requerido'); return }
    setIsEditing(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar usuario')
      }
      toast.success('Usuario actualizado correctamente')
      setShowEditDialog(false)
      setSelectedUser(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar usuario')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteUserId) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/users/${deleteUserId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar usuario')
      }
      toast.success('Usuario eliminado exitosamente')
      setDeleteUserId(null)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar el usuario')
    } finally {
      setIsDeleting(false)
    }
  }

  const openBudgetDialog = (user: any) => {
    setSelectedUser(user)
    setBudgetAmount(user.montoAsignado?.toString() || '0')
    setShowBudgetDialog(true)
  }

  const openEditDialog = (user: any) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditRole(user.role)
    setShowEditDialog(true)
  }

  // Totals
  const totalAsignado = data?.users?.reduce((sum: number, u: any) => sum + (u.montoAsignado || 0), 0) || 0
  const totalAprobado = data?.users?.reduce((sum: number, u: any) => sum + (u.montoAprobado || 0), 0) || 0
  const totalRendido = data?.users?.reduce((sum: number, u: any) => sum + (u.montoRendido || 0), 0) || 0
  const totalRestante = data?.users?.reduce((sum: number, u: any) => sum + (u.montoRestante || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            Usuarios y Control de Montos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gestione usuarios, perfiles y asignación de presupuestos
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Total Asignado</span>
              <div className="p-1.5 rounded-lg bg-blue-50">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-blue-700">{formatCLP(totalAsignado)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Total Aprobado</span>
              <div className="p-1.5 rounded-lg bg-emerald-50">
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-emerald-700">{formatCLP(totalAprobado)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Total Rendido</span>
              <div className="p-1.5 rounded-lg bg-amber-50">
                <DollarSign className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-amber-700">{formatCLP(totalRendido)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Total Restante</span>
              <div className={`p-1.5 rounded-lg ${totalRestante >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <TrendingUp className={`h-4 w-4 ${totalRestante >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${totalRestante >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {formatCLP(totalRestante)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List with Budget Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Control de Presupuestos por Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : data?.users?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Usuario</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Asignado</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Aprobado</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Rendido</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Restante</th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {data?.users?.map((user: any, index: number) => {
                        const restante = user.montoRestante || 0
                        const isOverBudget = restante < 0
                        const usagePercent = user.montoAsignado > 0
                          ? Math.round((user.montoRendido / user.montoAsignado) * 100)
                          : 0

                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="border-b hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <Badge variant="outline" className={`text-[9px] ${
                                      user.role === 'ADMIN'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                      {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                  <p className="text-[10px] text-muted-foreground">{user.reportsCount || 0} rendiciones</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-medium text-blue-700">{formatCLP(user.montoAsignado || 0)}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-medium text-emerald-700">{formatCLP(user.montoAprobado || 0)}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="font-medium text-amber-700">{formatCLP(user.montoRendido || 0)}</span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <div>
                                <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {formatCLP(restante)}
                                </span>
                                {user.montoAsignado > 0 && (
                                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                                    <div
                                      className={`h-1.5 rounded-full ${isOverBudget ? 'bg-red-500' : usagePercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                                    />
                                  </div>
                                )}
                                {isOverBudget && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    <AlertTriangle className="h-2.5 w-2.5 text-red-500" />
                                    <span className="text-[9px] text-red-500">Excedido</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                                  onClick={() => openBudgetDialog(user)}
                                  title="Asignar presupuesto"
                                >
                                  <Wallet className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => openEditDialog(user)}
                                  title="Editar perfil"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteUserId(user.id)}
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {data?.users?.map((user: any) => {
                  const restante = user.montoRestante || 0
                  const isOverBudget = restante < 0
                  return (
                    <div key={user.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openBudgetDialog(user)}>
                            <Wallet className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(user)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Asignado:</span> <span className="font-medium text-blue-700">{formatCLP(user.montoAsignado || 0)}</span></div>
                        <div><span className="text-muted-foreground">Aprobado:</span> <span className="font-medium text-emerald-700">{formatCLP(user.montoAprobado || 0)}</span></div>
                        <div><span className="text-muted-foreground">Rendido:</span> <span className="font-medium text-amber-700">{formatCLP(user.montoRendido || 0)}</span></div>
                        <div><span className="text-muted-foreground">Restante:</span> <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>{formatCLP(restante)}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo usuario en el sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre Completo *</Label>
              <Input id="user-name" placeholder="Ej: Juan Pérez" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="user-email" type="email" placeholder="Ej: juan@empresa.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password">Contraseña *</Label>
              <Input id="user-password" type="password" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="user-role">Rol</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER"><div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Usuario</div></SelectItem>
                    <SelectItem value="ADMIN"><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Administrador</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-budget">Monto Asignado (CLP)</Label>
                <Input id="user-budget" type="number" placeholder="0" value={newMontoAsignado} onChange={(e) => setNewMontoAsignado(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget Assignment Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              Asignar Presupuesto
            </DialogTitle>
            <DialogDescription>
              {selectedUser && `Asignar presupuesto para ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-2">
              {/* Current stats */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-[10px] text-muted-foreground">Aprobado</span>
                  <p className="text-sm font-bold text-emerald-700">{formatCLP(selectedUser.montoAprobado || 0)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Rendido</span>
                  <p className="text-sm font-bold text-amber-700">{formatCLP(selectedUser.montoRendido || 0)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Restante actual</span>
                  <p className={`text-sm font-bold ${(selectedUser.montoRestante || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {formatCLP(selectedUser.montoRestante || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground">Rendiciones</span>
                  <p className="text-sm font-bold">{selectedUser.reportsCount || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-amount">Monto Asignado (CLP)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="budget-amount"
                    type="number"
                    placeholder="0"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  El monto restante se calcula automáticamente: Asignado - Rendido
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)} disabled={isSavingBudget}>Cancelar</Button>
            <Button onClick={handleSaveBudget} disabled={isSavingBudget} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSavingBudget ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar Presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-emerald-600" />
              Editar Perfil de Usuario
            </DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER"><div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Usuario</div></SelectItem>
                  <SelectItem value="ADMIN"><div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Administrador</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isEditing}>Cancelar</Button>
            <Button onClick={handleEditUser} disabled={isEditing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isEditing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer. Las rendiciones asociadas al usuario también serán eliminadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteUserId(null)} disabled={isDeleting}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
