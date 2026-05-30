import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { formatCLP } from '@/lib/format-currency'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')

    if (!reportId) {
      return NextResponse.json({ error: 'Se requiere ID de rendición' }, { status: 400 })
    }

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

    // Generate HTML for PDF rendering on client side
    const htmlContent = generatePDFHtml(report)

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="rendicion_${reportId}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}

function generatePDFHtml(report: any): string {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    SUBMITTED: 'Enviado',
    APPROVED: 'Aprobado',
    REJECTED: 'Rechazado',
    MODIFICATION_REQUESTED: 'Modificación Solicitada',
  }

  const statusColors: Record<string, string> = {
    DRAFT: '#6b7280',
    SUBMITTED: '#f59e0b',
    APPROVED: '#10b981',
    REJECTED: '#ef4444',
    MODIFICATION_REQUESTED: '#f97316',
  }

  const totalMontoRendir = report.items.reduce((sum: number, item: any) => sum + (item.montoRendir || 0), 0)

  const itemsRows = report.items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.numeroBoleta || '-'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCLP(item.amount)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCLP(item.montoRendir || 0)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.category}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${new Date(item.expenseDate).toLocaleDateString('es-CL')}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.imageBoletaUrl ? '<span style="color: #10b981;">Si</span>' : 'No'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.imageCompraUrl ? '<span style="color: #10b981;">Si</span>' : 'No'}</td>
    </tr>
  `).join('')

  const imageSection = report.items.map((item: any) => {
    const parts = []
    if (item.imageBoletaUrl) {
      parts.push(`
        <div style="margin-bottom: 12px; page-break-inside: avoid;">
          <p style="font-weight: 600; margin-bottom: 4px; color: #374151; font-size: 13px;">${item.description} - Foto de la Boleta</p>
          <img src="${item.imageBoletaUrl}" alt="Boleta: ${item.description}" style="max-width: 350px; max-height: 250px; border: 1px solid #e5e7eb; border-radius: 8px;" />
        </div>
      `)
    }
    if (item.imageCompraUrl) {
      parts.push(`
        <div style="margin-bottom: 12px; page-break-inside: avoid;">
          <p style="font-weight: 600; margin-bottom: 4px; color: #374151; font-size: 13px;">${item.description} - Foto de la Compra</p>
          <img src="${item.imageCompraUrl}" alt="Compra: ${item.description}" style="max-width: 350px; max-height: 250px; border: 1px solid #e5e7eb; border-radius: 8px;" />
        </div>
      `)
    }
    return parts.join('')
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rendición de Gastos - ${report.title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1 { color: #059669; font-size: 24px; margin-bottom: 4px; }
    h2 { color: #374151; font-size: 18px; margin-top: 30px; margin-bottom: 12px; border-bottom: 2px solid #059669; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background-color: #059669; color: white; padding: 8px; text-align: left; font-size: 11px; }
    .total-row td { font-weight: 700; border-top: 2px solid #059669; padding: 8px; }
  </style>
</head>
<body>
  <div class="no-print" style="background: #ecfdf5; border: 1px solid #059669; border-radius: 8px; padding: 12px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
    <span style="color: #065f46; font-weight: 600;">Vista previa del documento</span>
    <button onclick="window.print()" style="background: #059669; color: white; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: 600;">Imprimir / Guardar PDF</button>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
    <div>
      <h1>Rendición de Gastos</h1>
      <p style="color: #6b7280; font-size: 14px;">${report.title}</p>
    </div>
    <span style="background: ${statusColors[report.status] || '#6b7280'}; color: white; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">${statusLabels[report.status] || report.status}</span>
  </div>

  <div style="background: #f9fafb; border-radius: 10px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
    <div>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">Solicitante</p>
      <p style="font-weight: 600;">${report.user.name}</p>
    </div>
    <div>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">Email</p>
      <p style="font-weight: 600;">${report.user.email}</p>
    </div>
    <div>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">Fecha Creación</p>
      <p style="font-weight: 600;">${new Date(report.createdAt).toLocaleDateString('es-CL')}</p>
    </div>
    <div>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 2px;">Monto Total</p>
      <p style="font-weight: 700; color: #059669; font-size: 18px;">${formatCLP(report.totalAmount)}</p>
    </div>
  </div>

  ${report.description ? `<p style="margin-bottom: 24px; color: #4b5563;"><strong>Descripcion:</strong> ${report.description}</p>` : ''}

  <h2>Detalle de Gastos</h2>
  <table>
    <thead>
      <tr>
        <th>Descripcion</th>
        <th style="text-align: center;">N. Boleta</th>
        <th style="text-align: right;">Monto</th>
        <th style="text-align: right;">Monto a Rendir</th>
        <th>Categoria</th>
        <th style="text-align: center;">Fecha</th>
        <th style="text-align: center;">Foto Boleta</th>
        <th style="text-align: center;">Foto Compra</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      <tr class="total-row">
        <td style="padding: 8px; border-top: 2px solid #059669;">TOTAL</td>
        <td style="padding: 8px; border-top: 2px solid #059669;"></td>
        <td style="padding: 8px; border-top: 2px solid #059669; text-align: right; color: #059669; font-size: 14px;">${formatCLP(report.totalAmount)}</td>
        <td style="padding: 8px; border-top: 2px solid #059669; text-align: right; color: #2563eb; font-size: 14px;">${formatCLP(totalMontoRendir)}</td>
        <td style="padding: 8px; border-top: 2px solid #059669;"></td>
        <td style="padding: 8px; border-top: 2px solid #059669;"></td>
        <td style="padding: 8px; border-top: 2px solid #059669;"></td>
        <td style="padding: 8px; border-top: 2px solid #059669;"></td>
      </tr>
    </tbody>
  </table>

  ${imageSection ? `<div class="page-break"></div><h2>Comprobantes Adjuntos</h2>${imageSection}` : ''}

  ${report.reviewNote ? `
  <div style="margin-top: 30px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px;">
    <p style="font-weight: 600; color: #92400e; margin-bottom: 4px;">Nota de Revision</p>
    <p style="color: #78350f;">${report.reviewNote}</p>
  </div>` : ''}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; display: flex; justify-content: space-between;">
    <span>Generado el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}</span>
    <span>Sistema de Rendicion de Gastos</span>
  </div>
</body>
</html>`
}
