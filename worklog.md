---
Task ID: 1
Agent: Main Agent
Task: Fix missing fields and features in expense reporting app

Work Log:
- Analyzed current codebase state: schema, API routes, form, detail view, exports
- Identified critical bug: /api/upload route was missing, causing image upload failures for all users
- Updated Prisma schema: replaced single optional imageUrl with numeroBoleta (required), montoRendir (required), imageBoletaUrl (required), imageCompraUrl (required)
- Created /api/upload route that converts files to base64 data URLs for SQLite storage
- Updated /api/items POST route with validation for all new required fields
- Updated /api/items/[id] PUT route with support for all new fields
- Updated report-form.tsx with: numeroBoleta field, montoRendir field, two separate ImageUpload components (foto boleta + foto compra), all marked as required with validation
- Updated report-detail.tsx with: display of numeroBoleta, montoRendir, two photo thumbnails per item, photo preview dialog, total monto a rendir
- Updated /api/export/pdf with: numeroBoleta column, montoRendir column, both photo columns, both photo image sections
- Updated /api/export/excel with: numeroBoleta column, montoRendir column, both photo indicator columns, total montoRendir in summary
- Updated seed route to include new required fields in demo data
- Added Loader2 import to report-detail.tsx
- Reset database and re-seeded with correct schema
- Build passes successfully
- Server running and tested: login works, upload works, all through Caddy proxy

Stage Summary:
- All 4 missing features implemented: numero de boleta, monto a rendir, foto de la boleta, foto de la compra
- All fields are REQUIRED for all profiles
- Critical /api/upload route bug fixed
- Demo credentials: admin@empresa.com/password123, maria@empresa.com/password123, carlos@empresa.com/password123
