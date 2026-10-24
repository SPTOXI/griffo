import type { CityJob } from '@/lib/vagas/city-index.server'
import { categoryLabel } from '@/lib/jobs/category-labels'

const SENIORITY: Record<string, string> = {
  intern: 'Estágio',
  junior: 'Júnior',
  mid: 'Pleno',
  senior: 'Sênior',
  lead: 'Liderança',
  principal: 'Especialista',
  director: 'Diretoria',
  executive: 'Executivo',
}
const REMOTE: Record<string, string> = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' }

/** Fontes que não informam a empresa mandam um marcador em vez de nada. */
const NO_COMPANY = new Set(['unknown', 'n/a', 'confidencial', 'confidential', ''])

const dateFmt = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })

/** Lista de vagas. O link vai para a candidatura na fonte, fora do Griffo. */
export function JobList({ jobs }: { jobs: CityJob[] }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
      {jobs.map((j) => {
        const tags = [
          j.remoteType && REMOTE[j.remoteType],
          j.seniority && SENIORITY[j.seniority],
          j.category && categoryLabel(j.category, 'pt'),
        ].filter(Boolean)
        return (
          <li key={j.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#0B192E] break-words">{j.title}</h3>
              <p className="text-sm text-slate-600">
                {NO_COMPANY.has(j.company.trim().toLowerCase()) ? '' : `${j.company} · `}
                {j.city}
                {j.region && j.region !== j.city ? ` – ${j.region}` : ''}
              </p>
              {tags.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span key={t as string} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{t}</span>
                  ))}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {j.publishedAt && <span className="text-xs text-slate-500">{dateFmt.format(j.publishedAt)}</span>}
              <a
                href={j.applicationUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Ver vaga
              </a>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
