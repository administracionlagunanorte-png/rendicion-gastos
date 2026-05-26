import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-helper"
import { db } from "@/lib/db"

// PUT /api/items/[id] - Actualizar un item de gasto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { description, amount, category, expenseDate, imageUrl, compraImageUrl } = body
    const userId = session.user.id
    const userRole = session.user.role

    // Verificar que el item existe
    const existingItem = await db.expenseItem.findUnique({
      where: { id },
      include: { report: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item de gasto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (existingItem.report.userId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para editar este gasto" },
        { status: 403 }
      )
    }

    // Solo se puede editar si el reporte está en BORRADOR o MODIFICACIÓN SOLICITADA
    if (!["DRAFT", "MODIFICATION_REQUESTED"].includes(existingItem.report.status)) {
      return NextResponse.json(
        { error: "Solo se pueden editar gastos de reportes en borrador o con modificación solicitada" },
        { status: 400 }
      )
    }

    // Validar monto si se proporciona
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      )
    }

    // La foto de la boleta es obligatoria - no se puede quitar
    if (imageUrl !== undefined && (!imageUrl || imageUrl.trim() === "")) {
      return NextResponse.json(
        { error: "La foto de la boleta es obligatoria" },
        { status: 400 }
      )
    }

    // La foto de la compra es obligatoria - no se puede quitar
    if (compraImageUrl !== undefined && (!compraImageUrl || compraImageUrl.trim() === "")) {
      return NextResponse.json(
        { error: "La foto de la compra es obligatoria" },
        { status: 400 }
      )
    }

    // Calcular diferencia de monto para actualizar total del reporte
    const oldAmount = existingItem.amount
    const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount

    // Actualizar item
    const updateData: any = {}
    if (description !== undefined) updateData.description = description.trim()
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (category !== undefined) updateData.category = category.trim()
    if (expenseDate !== undefined) updateData.expenseDate = new Date(expenseDate)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null
    if (compraImageUrl !== undefined) updateData.compraImageUrl = compraImageUrl || null

    const item = await db.expenseItem.update({
      where: { id },
      data: updateData
    })

    // Actualizar monto total del reporte
    if (newAmount !== oldAmount) {
      await db.expenseReport.update({
        where: { id: existingItem.reportId },
        data: {
          totalAmount: existingItem.report.totalAmount - oldAmount + newAmount
        }
      })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error al actualizar item de gasto:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al actualizar item de gasto" },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Eliminar un item de gasto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      )
    }

    const { id } = await params
    const userId = session.user.id
    const userRole = session.user.role

    // Verificar que el item existe
    const existingItem = await db.expenseItem.findUnique({
      where: { id },
      include: { report: true }
    })

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item de gasto no encontrado" },
        { status: 404 }
      )
    }

    // Verificar permisos
    if (existingItem.report.userId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para eliminar este gasto" },
        { status: 403 }
      )
    }

    // Solo se puede eliminar si el reporte está en BORRADOR o MODIFICACIÓN SOLICITADA
    if (!["DRAFT", "MODIFICATION_REQUESTED"].includes(existingItem.report.status)) {
      return NextResponse.json(
        { error: "Solo se pueden eliminar gastos de reportes en borrador o con modificación solicitada" },
        { status: 400 }
      )
    }

    // Eliminar item
    await db.expenseItem.delete({
      where: { id }
    })

    // Actualizar monto total del reporte
    await db.expenseReport.update({
      where: { id: existingItem.reportId },
      data: {
        totalAmount: existingItem.report.totalAmount - existingItem.amount
      }
    })

    return NextResponse.json({ message: "Gasto eliminado exitosamente" })
  } catch (error) {
    console.error("Error al eliminar item de gasto:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al eliminar item de gasto" },
      { status: 500 }
    )
  }
}
