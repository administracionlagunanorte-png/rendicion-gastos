import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neon } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  // If using Neon (postgresql://...neon.tech), use the serverless adapter
  if (databaseUrl && databaseUrl.includes('neon.tech')) {
    const sql = neon(databaseUrl)
    const adapter = new PrismaNeon(sql)
    return new PrismaClient({ adapter } as any)
  }

  // Fallback for local development (SQLite or local PostgreSQL)
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
