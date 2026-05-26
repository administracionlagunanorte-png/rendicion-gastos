import { NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth-helper"
import { db } from "@/lib/db"

// POST /api/items - Crear nuevo item de gasto
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { description, amount, category, expenseDate, imageUrl, reportId } = body
    const userId = session.user.id
    const userRole = session.user.role

    // Validaciones
    if (!description || description.trim() === "") {
      return NextResponse.json(
        { error: "La descripción del gasto es requerida" },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "El monto debe ser mayor a 0" },
        { status: 400 }
      )
    }

    if (!category || category.trim() === "") {
      return NextResponse.json(
        { error: "La categoría es requerida" },
        { status: 400 }
      )
    }

    if (!expenseDate) {
      return NextResponse.json(
        { error: "La fecha del gasto es requerida" },
        { status: 400 }
      )
    }

    if (!imageUrl || imageUrl.trim() === "") {
      return NextResponse.json(
        { error: "La foto del comprobante es obligatoria" },
        { status: 400 }
      )
    }

    if (!reportId) {
      return NextResponse.json(
        { error: "El ID del reporte es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el reporte existe y pertenece al usuario
    const report = await db.expenseReport.findUnique({
      where: { id: reportId },
      include: { items: true }
    })

    if (!report) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      )
    }

    // Solo el dueño o admin puede agregar items
    if (report.userId !== userId && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "No tiene permisos para agregar gastos a este reporte" },
        { status: 403 }
      )
    }

    // Solo se pueden agregar items a reportes en BORRADOR o MODIFICACIÓN SOLICITADA
    if (!["DRAFT", "MODIFICATION_REQUESTED"].includes(report.status)) {
      return NextResponse.json(
        { error: "Solo se pueden agregar gastos a reportes en borrador o con modificación solicitada" },
        { status: 400 }
      )
    }

    // Crear item
    const item = await db.expenseItem.create({
      data: {
        description: description.trim(),
        amount: parseFloat(amount),
        category: category.trim(),
        expenseDate: new Date(expenseDate),
        imageUrl: imageUrl || null,
        reportId
      }
    })

    // Actualizar monto total del reporte
    const newTotal = report.totalAmount + item.amount
    await db.expenseReport.update({
      where: { id: reportId },
      data: { totalAmount: newTotal }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error("Error al crear item de gasto:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al crear item de gasto" },
      { status: 500 }
    )
  }
}
