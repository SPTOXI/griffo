export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { getAdminUser } from '@/lib/admin'
import { db } from '@/lib/db'
import { freshOpenJobWhere } from '@/lib/jobs/lifecycle'
import { citySpellings } from '@/lib/city-jobs/city-index'
import {
  CITY_JOBS_CACHE_TAG,
  countryExclusions,
  loadCityIndex,
  loadCityRules,
} from '@/lib/city-jobs/city-index.server'
import { CITY_JOBS_COUNTRY_SLUGS } from '@/lib/city-jobs/context'

/**
 * Cadastro de cidades das páginas de vagas (`/[país]/jobs`), para o painel.
 *
 * GET devolve a fila de um país: as grafias que aparecem nas vagas abertas,
 * as ainda sem regra primeiro, e as cidades já formadas (alvo do "juntar
 * com"). POST grava uma regra; DELETE desfaz. Toda escrita expira o índice
 * em cache, para a página mudar na hora.
 */

const countrySchema = z.string().regex(/^[A-Za-z]{2}$/).transform((c) => c.toUpperCase())

const ruleSchema = z
  .object({
    country: countrySchema,
    rawSlug: z.string().min(1).max(120),
    kind: z.enum(['city', 'alias', 'ignore']),
    canonicalSlug: z.string().min(1).max(120).optional(),
    displayName: z.string().trim().min(1).max(120).optional(),
  })
  .refine((r) => r.kind !== 'alias' || (r.canonicalSlug && r.canonicalSlug !== r.rawSlug), 'Apelido precisa da cidade de destino.')

function supported(country: string): boolean {
  return CITY_JOBS_COUNTRY_SLUGS.includes(country.toLowerCase())
}

export async function GET(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const parsed = countrySchema.safeParse(req.nextUrl.searchParams.get('country') ?? 'BR')
  if (!parsed.success || !supported(parsed.data)) return NextResponse.json({ error: 'País inválido.' }, { status: 400 })
  const country = parsed.data

  const [rows, rules, index] = await Promise.all([
    db.job.groupBy({
      by: ['city'],
      where: { ...freshOpenJobWhere(), country, city: { not: null } },
      _count: { _all: true },
    }),
    loadCityRules(country),
    loadCityIndex(country),
  ])
  const spellings = citySpellings(
    rows.map((r) => ({ city: r.city, category: null, count: r._count._all })),
    countryExclusions(country),
    rules
  )
  return NextResponse.json({
    country,
    countries: CITY_JOBS_COUNTRY_SLUGS.map((s) => s.toUpperCase()),
    pending: spellings.filter((s) => !s.rule).length,
    spellings: spellings.slice(0, 300),
    cities: index.map((c) => ({ slug: c.slug, name: c.name, total: c.total })),
  })
}

export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const parsed = ruleSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success || !supported(parsed.data.country)) {
    return NextResponse.json({ error: parsed.success ? 'País inválido.' : parsed.error.issues[0]?.message }, { status: 400 })
  }
  const { country, rawSlug, kind, canonicalSlug, displayName } = parsed.data
  const data = {
    kind,
    canonicalSlug: kind === 'alias' ? canonicalSlug! : null,
    displayName: kind === 'city' ? displayName ?? null : null,
  }
  await db.cityAlias.upsert({
    where: { country_rawSlug: { country, rawSlug } },
    create: { country, rawSlug, ...data },
    update: data,
  })
  revalidateTag(CITY_JOBS_CACHE_TAG, { expire: 0 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await getAdminUser())) return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  const parsed = z.object({ country: countrySchema, rawSlug: z.string().min(1).max(120) }).safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 })
  await db.cityAlias.deleteMany({ where: parsed.data })
  revalidateTag(CITY_JOBS_CACHE_TAG, { expire: 0 })
  return NextResponse.json({ ok: true })
}
