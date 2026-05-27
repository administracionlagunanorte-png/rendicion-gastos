import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getAuthSession(request)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado. Inicie sesión para continuar.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let reports

    if (reportId) {
      const report = await db.expenseReport.findUnique({
        where: { id: reportId },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true
        }
      })
      if (!report) {
        return NextResponse.json({ error: 'Rendición no encontrada' }, { status: 404 })
      }
      reports = [report]
    } else {
      const where: any = {}
      if (status) where.status = status
      if (userId) where.userId = userId
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59.999')
      }

      reports = await db.expenseReport.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true
        },
        orderBy: { createdAt: 'desc' }
      })
    }

    if (reports.length === 0) {
      return NextResponse.json({ error: 'No hay rendiciones para exportar' }, { status: 404 })
    }

    const wb = XLSX.utils.book_new()

    // ===== Sheet 1: Summary with company header =====
    const summaryHeader = [
      ['', '', 'LAGUNA NORTE', '', ''],
      ['', '', 'Sistema de Rendición de Gastos', '', ''],
      ['', '', `Exportado: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`, '', ''],
      [],  // Empty row
    ]

    const summaryDataRows = reports.map(r => ({
      'ID Rendición': r.id,
      'Título': r.title,
      'Descripción': r.description || '',
      'Solicitante': r.user.name,
      'Email': r.user.email,
      'Estado': getStatusLabel(r.status),
      'Monto Total': r.totalAmount,
      'Monto a Rendir': r.montoRendir,
      'Diferencia': r.montoRendir > 0 ? r.montoRendir - r.totalAmount : '',
      'Número de Boleta': r.numeroBoleta || '',
      'Cantidad de Gastos': r.items.length,
      'Nota de Revisión': r.reviewNote || '',
      'Fecha Creación': r.createdAt.toLocaleDateString('es-CL'),
      'Fecha Actualización': r.updatedAt.toLocaleDateString('es-CL'),
    }))

    // Create sheet from header + data
    const summaryHeaderAoA = summaryHeader.map(row => row.map(cell => cell))
    const summaryDataAoA = XLSX.utils.json_to_sheet(summaryDataRows, { skipHeader: false })

    // Build the complete sheet
    const fullSummaryAoA = [
      ...summaryHeaderAoA,
      XLSX.utils.sheet_to_json(summaryDataAoA, { header: 1 })[0], // Column headers
      ...XLSX.utils.sheet_to_json(summaryDataAoA, { header: 1 }).slice(1), // Data rows
    ]

    const summaryWs = XLSX.utils.aoa_to_sheet(fullSummaryAoA)

    // Set column widths
    summaryWs['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 20 }, { wch: 25 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }
    ]

    // Merge cells for company header
    summaryWs['!merges'] = [
      { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } },  // "LAGUNA NORTE"
      { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },  // "Sistema de Rendición..."
      { s: { r: 2, c: 2 }, e: { r: 2, c: 4 } },  // Export date
    ]

    // Style the header cells (company name)
    const companyCell = summaryWs['C1']
    if (companyCell) {
      companyCell.s = {
        font: { bold: true, sz: 16, color: { rgb: '059669' } },
        alignment: { horizontal: 'center' }
      }
    }

    const subtitleCell = summaryWs['C2']
    if (subtitleCell) {
      subtitleCell.s = {
        font: { bold: true, sz: 11, color: { rgb: '374151' } },
        alignment: { horizontal: 'center' }
      }
    }

    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Rendiciones')

    // ===== Sheet 2: Detail =====
    const detailHeader = [
      ['', 'LAGUNA NORTE - Detalle de Gastos', '', '', '', '', '', '', '', ''],
      [],  // Empty row
    ]

    const detailData: any[] = []
    reports.forEach(r => {
      r.items.forEach((item, idx) => {
        detailData.push({
          'ID Rendición': idx === 0 ? r.id : '',
          'Título Rendición': idx === 0 ? r.title : '',
          'Solicitante': idx === 0 ? r.user.name : '',
          'Estado Rendición': idx === 0 ? getStatusLabel(r.status) : '',
          'Monto a Rendir': idx === 0 && r.montoRendir > 0 ? r.montoRendir : '',
          'Número de Boleta': idx === 0 && r.numeroBoleta ? r.numeroBoleta : '',
          'Descripción Gasto': item.description,
          'Monto': item.amount,
          'Categoría': getCategoryLabel(item.category),
          'Fecha Gasto': new Date(item.expenseDate).toLocaleDateString('es-CL'),
          'Comprobante': item.imageUrl ? 'Sí' : 'No',
          'URL Comprobante': item.imageUrl || '',
        })
      })
    })

    if (detailData.length > 0) {
      const detailDataAoA = XLSX.utils.json_to_sheet(detailData, { skipHeader: false })
      const fullDetailAoA = [
        ...detailHeader,
        XLSX.utils.sheet_to_json(detailDataAoA, { header: 1 })[0],
        ...XLSX.utils.sheet_to_json(detailDataAoA, { header: 1 }).slice(1),
      ]

      const detailWs = XLSX.utils.aoa_to_sheet(fullDetailAoA)
      detailWs['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 18 },
        { wch: 15 }, { wch: 18 }, { wch: 30 }, { wch: 12 },
        { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
      ]

      // Merge cells for company header in detail sheet
      detailWs['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 6 } },
      ]

      XLSX.utils.book_append_sheet(wb, detailWs, 'Detalle Gastos')
    }

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const filename = reportId
      ? `rendicion_laguna_norte_${reportId}.xlsx`
      : `rendiciones_laguna_norte_${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting Excel:', error)
    return NextResponse.json({ error: 'Error al exportar Excel' }, { status: 500 })
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    SUBMITTED: 'Enviado',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    MODIFICATION_REQUESTED: 'Modificación Solicitada',
  }
  return labels[status] || status
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ALIMENTACION: 'Alimentación',
    TRANSPORTE: 'Transporte',
    ALOJAMIENTO: 'Alojamiento',
    ENTRETENIMIENTO: 'Entretenimiento',
    OFICINA: 'Oficina',
    OTRO: 'Otro',
  }
  return labels[category] || category
}
