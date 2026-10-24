import type { Metadata } from 'next'
import Link from 'next/link'
import { MIN_JOBS_TO_INDEX } from '@/lib/vagas/city-index'
import { loadCityIndex } from '@/lib/vagas/city-index.server'
import { ResumeCta, VagasShell } from '@/components/vagas/vagas-shell'

export const revalidate = 3600

const title = 'Vagas de emprego por cidade no Brasil | GriffoWork'
const description =
  'Vagas abertas nas principais cidades do Brasil, por área, atualizadas todo dia. Teste grátis se o seu currículo passa no ATS das empresas.'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://griffo.work/vagas' },
  openGraph: { title, description, url: 'https://griffo.work/vagas', siteName: 'GriffoWork', type: 'website', locale: 'pt_BR' },
}

export default async function VagasHub() {
  const cities = (await loadCityIndex()).filter((c) => c.total >= MIN_JOBS_TO_INDEX)
  const total = cities.reduce((s, c) => s + c.total, 0)
  return (
    <VagasShell>
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B192E]">Vagas de emprego por cidade</h1>
        <p className="text-slate-600">
          {total.toLocaleString('pt-BR')} vagas abertas em {cities.length} cidades do Brasil, reunidas de várias fontes e
          atualizadas todo dia.
        </p>
      </div>
      <ResumeCta />
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {cities.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/vagas/${c.slug}`}
              className="flex justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-[#0B63E5]"
            >
              <span className="font-semibold text-[#0B192E]">{c.name}</span>
              <span className="text-sm text-slate-500">{c.total.toLocaleString('pt-BR')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </VagasShell>
  )
}
