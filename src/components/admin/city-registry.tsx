'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { internalFetch } from '@/lib/internal-fetch'

/**
 * Cadastro de cidades das páginas de vagas (`/[país]/jobs`).
 *
 * A fila mostra as grafias que aparecem nas vagas abertas de um país, as ainda
 * sem regra primeiro. Para cada uma: é cidade (fica), é outro nome ou bairro de
 * uma cidade (junta nela), ou não é cidade (some). Grafia sem regra continua
 * aparecendo como veio; a fila só serve para arrumar.
 */

interface Rule {
  rawSlug: string
  kind: 'city' | 'alias' | 'ignore'
  canonicalSlug?: string | null
  displayName?: string | null
}

interface Spelling {
  rawSlug: string
  name: string
  count: number
  rule: Rule | null
}

interface Payload {
  country: string
  countries: string[]
  pending: number
  spellings: Spelling[]
  cities: { slug: string; name: string; total: number }[]
}

const KIND_LABEL: Record<Rule['kind'], string> = { city: 'Cidade', alias: 'Junta em', ignore: 'Não é cidade' }

export function CityRegistry() {
  const [country, setCountry] = useState('BR')
  const [data, setData] = useState<Payload | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({})
  const [showDone, setShowDone] = useState(false)

  const load = useCallback(async (c: string) => {
    setLoading(true)
    try {
      const res = await internalFetch(`/api/admin/cities?country=${c}`, { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      setData(await res.json())
    } catch (e: any) {
      toast.error(`Não consegui carregar as cidades: ${e?.message || e}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(country)
  }, [country, load])

  const save = async (s: Spelling, body: Omit<Rule, 'rawSlug'> | null) => {
    setBusy(s.rawSlug)
    try {
      const res = await internalFetch('/api/admin/cities', {
        method: body ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country, rawSlug: s.rawSlug, ...(body ?? {}) }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
      await load(country)
    } catch (e: any) {
      toast.error(`Não salvou: ${e?.message || e}`)
    } finally {
      setBusy(null)
    }
  }

  const shown = data?.spellings.filter((s) => showDone || !s.rule) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de cidades</CardTitle>
        <CardDescription>
          Grafias de cidade que aparecem nas vagas abertas, usadas nas páginas <code>/{country.toLowerCase()}/jobs</code>.
          Marque o que é cidade, junte outros nomes e bairros na cidade certa, e esconda o que não é cidade. A página
          muda na hora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
          >
            {(data?.countries ?? ['BR']).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => load(country)} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          {data && (
            <Badge variant="outline" className={data.pending ? 'border-amber-300 bg-amber-50 text-amber-800' : ''}>
              {data.pending} a revisar
            </Badge>
          )}
          <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
            Mostrar já revisadas
          </label>
        </div>

        {data && shown.length === 0 && <p className="text-sm text-slate-500">Nada a revisar neste país.</p>}

        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {shown.map((s) => (
            <li key={s.rawSlug} className="flex flex-col gap-2 p-3 md:flex-row md:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">
                  {s.name} <span className="font-normal text-slate-500">· {s.count} vagas</span>
                </p>
                <p className="text-xs text-slate-500">
                  {s.rawSlug}
                  {s.rule && (
                    <>
                      {' · '}
                      <span className="font-semibold">{KIND_LABEL[s.rule.kind]}</span>
                      {s.rule.kind === 'alias' && ` ${s.rule.canonicalSlug}`}
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" disabled={busy === s.rawSlug} onClick={() => save(s, { kind: 'city' })}>
                  É cidade
                </Button>
                <select
                  value={mergeTarget[s.rawSlug] ?? ''}
                  onChange={(e) => setMergeTarget((m) => ({ ...m, [s.rawSlug]: e.target.value }))}
                  className="h-9 max-w-[12rem] rounded-md border border-slate-300 bg-white px-2 text-sm"
                >
                  <option value="">Juntar em…</option>
                  {data?.cities
                    .filter((c) => c.slug !== s.rawSlug)
                    .map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name} ({c.total})</option>
                    ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy === s.rawSlug || !mergeTarget[s.rawSlug]}
                  onClick={() => save(s, { kind: 'alias', canonicalSlug: mergeTarget[s.rawSlug] })}
                >
                  Juntar
                </Button>
                <Button size="sm" variant="outline" disabled={busy === s.rawSlug} onClick={() => save(s, { kind: 'ignore' })}>
                  Não é cidade
                </Button>
                {s.rule && (
                  <Button size="sm" variant="ghost" disabled={busy === s.rawSlug} onClick={() => save(s, null)}>
                    Desfazer
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
