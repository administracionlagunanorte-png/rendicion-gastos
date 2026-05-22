import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-config"
import { db } from "@/lib/db"

// GET /api/stats - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role
    const userId = (session.user as any).id

    if (userRole === "ADMIN") {
      // Estadísticas para administrador
      const [
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
        totalUsers,
        totalAmount,
        reportsByStatus
      ] = await Promise.all([
        db.expenseReport.count(),
        db.expenseReport.count({ where: { status: "SUBMITTED" } }),
        db.expenseReport.count({ where: { status: "APPROVED" } }),
        db.expenseReport.count({ where: { status: "REJECTED" } }),
        db.user.count({ where: { role: "USER" } }),
        db.expenseReport.aggregate({
          _sum: { totalAmount: true },
          where: { status: "APPROVED" }
        }),
        db.expenseReport.groupBy({
          by: ["status"],
          _count: { status: true },
          _sum: { totalAmount: true }
        })
      ])

      // Obtener gastos por categoría
      const expensesByCategory = await db.expenseItem.groupBy({
        by: ["category"],
        _sum: { amount: true },
        _count: { category: true }
      })

      // Obtener reportes recientes
      const recentReports = await db.expenseReport.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      return NextResponse.json({
        totalReports,
        pendingReports,
        approvedReports,
        rejectedReports,
        totalUsers,
        totalAmountApproved: totalAmount._sum.totalAmount || 0,
        reportsByStatus,
        expensesByCategory,
        recentReports
      })
    } else {
      // Estadísticas para usuario normal
      const [
        myReports,
        myDrafts,
        mySubmitted,
        myApproved,
        myRejected,
        myTotalAmount
      ] = await Promise.all([
        db.expenseReport.count({ where: { userId } }),
        db.expenseReport.count({ where: { userId, status: "DRAFT" } }),
        db.expenseReport.count({ where: { userId, status: "SUBMITTED" } }),
        db.expenseReport.count({ where: { userId, status: "APPROVED" } }),
        db.expenseReport.count({ where: { userId, status: "REJECTED" } }),
        db.expenseReport.aggregate({
          _sum: { totalAmount: true },
          where: { userId, status: "APPROVED" }
        })
      ])

      // Gastos por categoría del usuario
      const myExpensesByCategory = await db.expenseItem.groupBy({
        by: ["category"],
        _sum: { amount: true },
        _count: { category: true },
        where: {
          report: { userId }
        }
      })

      // Reportes recientes del usuario
      const myRecentReports = await db.expenseReport.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: true
        }
      })

      return NextResponse.json({
        myReports,
        myDrafts,
        mySubmitted,
        myApproved,
        myRejected,
        myTotalApproved: myTotalAmount._sum.totalAmount || 0,
        myExpensesByCategory,
        myRecentReports
      })
    }
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    return NextResponse.json(
      { error: "Error interno del servidor al obtener estadísticas" },
      { status: 500 }
    )
  }
}
