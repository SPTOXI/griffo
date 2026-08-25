'use client'

import { useEffect, useState } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Trash2, FileSearch, FileEdit, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'
import { localeForLang } from '@/lib/i18n'

interface ResumeListItem {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

export function HistoryView() {
  const { t, lang } = useI18n()
  const h = t.history
  const locale = localeForLang(lang)
  const { openResume, setView } = useNav()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    internalFetch('/api/resume/upload', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setResumes(d.resumes || []))
      .finally(() => setLoading(false))
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (id: string) => {
    if (!confirm(h.deleteConfirm)) return
    setDeleting(id)
    try {
      const r = await internalFetch(`/api/resume/${id}?id=${id}`, { method: 'DELETE' })
      if (r.ok) {
        toast.success(h.deleteSuccess)
        load()
      } else {
        toast.error(h.deleteError)
      }
    } finally {
      setDeleting(null)
    }
  }

  // Mesma progressão de status usada em dashboard.tsx — o vocabulário é o
  // mesmo, a cor tem que contar a mesma história nas duas telas.
  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    uploaded: { label: h.statusUploaded, color: 'bg-slate-100 text-slate-700', icon: Upload },
    analyzed: { label: h.statusAnalyzed, color: 'bg-primary/10 text-primary', icon: FileSearch },
    rewrite_requested: { label: h.statusRewriteRequested, color: 'bg-amber-100 text-amber-700', icon: FileEdit },
    rewritten: { label: h.statusRewritten, color: 'bg-emerald-100 text-emerald-700', icon: FileEdit },
    confirmed: { label: h.statusConfirmed, color: 'bg-primary text-white', icon: Download },
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-navy">{h.title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{h.subtitle}</p>
        </div>
        <Button onClick={() => setView('upload')} size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Upload className="w-4 h-4 mr-1" /> {h.newButton}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-8 sm:p-10 text-center">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-bold mb-1">{h.emptyTitle}</p>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">{h.emptyDesc}</p>
              <Button onClick={() => setView('upload')} className="bg-primary hover:bg-primary/90 text-white font-bold">{h.emptyButton}</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {resumes.map((r) => {
                const s = statusMap[r.status] || statusMap.uploaded
                const Icon = s.icon
                return (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 hover:bg-slate-50/80 transition-colors">
                    <button
                      onClick={() => openResume(r.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Icon className="w-4 sm:w-5 h-4 sm:h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-brand-navy truncate">
                          {h.resumeOf.replace('{date}', new Date(r.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' }))}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500">
                          {h.updatedAt.replace('{date}', new Date(r.updatedAt).toLocaleString(locale))}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <Badge className={`${s.color} hover:${s.color} shrink-0 font-semibold text-[11px]`}>{s.label}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => del(r.id)}
                        disabled={deleting === r.id}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
