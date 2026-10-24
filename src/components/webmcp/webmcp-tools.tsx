'use client'

import { useEffect } from 'react'
import { getVisitorId } from '@/components/analytics/track-client'
import type { AtsCheckResult } from '@/lib/ats-check/score'
import type { HiringAtlas } from '@/lib/hiring-index/atlas'
import { MAX_RESUME_CHARS } from '@/lib/validation'
import {
  ATS_LIMIT_TEXT,
  HOW_IT_WORKS,
  PAGES,
  SITE,
  buildPagePath,
  formatAtsResult,
  formatCountryTemperature,
} from '@/lib/webmcp/tools'

/**
 * Registra as ferramentas WebMCP em `navigator.modelContext` (ver
 * `lib/webmcp/tools.ts`). Navegador sem WebMCP: não faz nada.
 *
 * A API ainda é proposta e mudou de forma entre versões: hoje é
 * `registerTool`/`unregisterTool`, antes era só `provideContext`. Os dois
 * caminhos ficam, e os tipos são locais para não depender de um `.d.ts` que
 * ainda não existe.
 */

type ToolResult = { content: { type: 'text'; text: string }[] }
interface WebMcpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: { readOnlyHint?: boolean }
  execute: (input: Record<string, unknown>) => Promise<ToolResult>
}
interface ModelContext {
  registerTool?: (tool: WebMcpTool) => { unregister?: () => void } | void
  unregisterTool?: (name: string) => void
  provideContext?: (ctx: { tools: WebMcpTool[] }) => void
}

const text = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }] })

const TOOLS: WebMcpTool[] = [
  {
    name: 'griffo_how_it_works',
    description: 'Explains what GriffoWork offers to job seekers and to companies, what is free and what is paid.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: async () => text(HOW_IT_WORKS),
  },
  {
    name: 'check_resume_ats',
    description:
      'Free check of how an applicant tracking system (ATS) reads a resume: score 0-100 and readability issues. ' +
      'Pass the resume as plain text. One free check per person every 24 hours; the resume is not stored.',
    inputSchema: {
      type: 'object',
      properties: { resume_text: { type: 'string', description: 'Full resume text.', maxLength: MAX_RESUME_CHARS } },
      required: ['resume_text'],
    },
    execute: async (input) => {
      const resume = String(input.resume_text ?? '').slice(0, MAX_RESUME_CHARS)
      if (!resume.trim()) return text('resume_text is empty.')
      const r = await fetch('/api/public/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resume, visitorId: getVisitorId() }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.status === 402) return text(ATS_LIMIT_TEXT)
      if (r.status === 429) return text('Too many requests. Try again in a few minutes.')
      if (!r.ok) return text(`The check failed. The user can try it directly at ${SITE}/ats-check`)
      return text(formatAtsResult(data as AtsCheckResult))
    },
  },
  {
    name: 'get_hiring_temperature',
    description:
      "Hiring temperature of a country (expansion, cooling, etc.) from official labor statistics, compared only with that country's own history.",
    inputSchema: {
      type: 'object',
      properties: { country: { type: 'string', description: 'ISO 3166-1 alpha-2 code, e.g. BR, US, DE.', pattern: '^[A-Za-z]{2}$' } },
      required: ['country'],
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => {
      const cc = String(input.country ?? '')
      if (!/^[A-Za-z]{2}$/.test(cc)) return text('country must be a 2-letter ISO code.')
      const r = await fetch('/api/hiring-index')
      if (!r.ok) return text(`The index is unavailable now. See ${SITE}/market-pulse`)
      return text(formatCountryTemperature((await r.json()) as HiringAtlas, cc))
    },
  },
  {
    name: 'open_griffo_page',
    description:
      'Opens a GriffoWork page for the user: home (resume analysis), ats_check (free ATS check), hiring (compare resume with a job just applied to), ' +
      'enterprise (for companies), market_pulse (hiring index), country (localized page; needs country).',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'string', enum: [...PAGES] },
        country: { type: 'string', description: "ISO alpha-2 code, only for page 'country'." },
        lang: { type: 'string', description: 'Optional language: pt, en, es, de, fr, it, ja, nl, sv, zh, ar, ko.' },
      },
      required: ['page'],
    },
    execute: async (input) => {
      const path = buildPagePath(String(input.page ?? ''), {
        country: input.country ? String(input.country) : undefined,
        lang: input.lang ? String(input.lang) : undefined,
      })
      if (!path) return text(`Unknown page. Use one of: ${PAGES.join(', ')} (country needs a 2-letter code).`)
      window.location.assign(path)
      return text(`Opened ${SITE}${path}`)
    },
  },
]

export function WebMcpTools() {
  useEffect(() => {
    const mc = (navigator as Navigator & { modelContext?: ModelContext }).modelContext
    if (!mc) return
    try {
      if (mc.registerTool) {
        const handles = TOOLS.map((t) => mc.registerTool!(t))
        return () => {
          TOOLS.forEach((t, i) => {
            try {
              const h = handles[i]
              if (h && h.unregister) h.unregister()
              else mc.unregisterTool?.(t.name)
            } catch {}
          })
        }
      }
      mc.provideContext?.({ tools: TOOLS })
    } catch {}
  }, [])
  return null
}
