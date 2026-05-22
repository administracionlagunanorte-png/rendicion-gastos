import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"

// PATCH /api/notifications/mark-all-read - Marcar todas las notificaciones como leídas
export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    const result = await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    })

    return NextResponse.json({
      message: "Todas las notificaciones marcadas como leídas",
      updatedCount: result.count
    })
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al marcar notificaciones como leídas" },
      { status: 500 }
    )
  }
}
