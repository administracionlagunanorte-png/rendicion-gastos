import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neon } from '@neondatabase/serverless'
import { sql } from '@vercel/postgres'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL

  // If using Neon (postgresql://...neon.tech), use the serverless adapter
  if (databaseUrl && databaseUrl.includes('neon.tech')) {
    const neonSql = neon(databaseUrl)
    const adapter = new PrismaNeon(neonSql)
    return new PrismaClient({ adapter } as any)
  }

  // If POSTGRES_URL is available (Vercel Postgres / Neon via @vercel/postgres)
  if (process.env.POSTGRES_URL) {
    const neonSql = neon(process.env.POSTGRES_URL)
    const adapter = new PrismaNeon(neonSql)
    return new PrismaClient({ adapter } as any)
  }

  // Fallback for local development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
