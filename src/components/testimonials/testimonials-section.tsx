'use client'

import { useEffect, useState } from 'react'
import { Quote } from 'lucide-react'
import { testimonialCopy } from '@/lib/testimonials/copy'

interface Item {
  id: string
  displayName: string
  city: string | null
  role: string | null
  text: string
}

/** Abaixo disso a seção não aparece: dois depoimentos soltos parecem fracos. */
const MIN_TO_SHOW = 3

/** Depoimentos aprovados na página inicial. Some sozinha enquanto não houver o bastante. */
export function TestimonialsSection({ lang }: { lang: string }) {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    let alive = true
    fetch(`/api/public/testimonials?lang=${encodeURIComponent(lang)}`)
      .then((r) => (r.ok ? r.json() : { testimonials: [] }))
      .then((d) => alive && setItems(d.testimonials ?? []))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [lang])

  if (items.length < MIN_TO_SHOW) return null
  const c = testimonialCopy(lang)
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#0B192E] text-center mb-8">{c.sectionTitle}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((t) => (
          <figure key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Quote className="h-5 w-5 text-[#0B63E5]" />
            <blockquote className="mt-2 text-sm leading-relaxed text-slate-700">{t.text}</blockquote>
            <figcaption className="mt-3 text-xs font-semibold text-[#0B192E]">
              {t.displayName}
              <span className="font-normal text-slate-500">{[t.role, t.city].filter(Boolean).map((x) => ` · ${x}`).join('')}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
