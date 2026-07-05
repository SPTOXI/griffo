'use client'

import { useEffect, useState } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Trash2, FileSearch, FileEdit, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface ResumeListItem {
  id: string
  status: string
  createdAt: string
  updatedAt: string
}

export function HistoryView() {
  const { openResume, setView } = useNav()
  const [resumes, setResumes] = useState<ResumeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/resume/upload', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setResumes(d.resumes || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm('Excluir este currículo permanentemente? Esta ação não pode ser desfeita.')) return
    setDeleting(id)
    try {
      const r = await fetch(`/api/resume/${id}?id=${id}`, { method: 'DELETE' })
      if (r.ok) {
        toast.success('Currículo excluído.')
        load()
      } else {
        toast.error('Falha ao excluir.')
      }
    } finally {
      setDeleting(null)
    }
  }

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    uploaded: { label: 'Enviado', color: 'bg-slate-100 text-slate-700', icon: Upload },
    analyzed: { label: 'Analisado', color: 'bg-sky-100 text-sky-700', icon: FileSearch },
    rewrite_requested: { label: 'Reescrita solicitada', color: 'bg-violet-100 text-violet-700', icon: FileEdit },
    rewritten: { label: 'Reescrito', color: 'bg-amber-100 text-amber-700', icon: FileEdit },
    confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700', icon: Download },
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico</h1>
          <p className="text-sm text-slate-500 mt-0.5">Todos os currículos que você enviou.</p>
        </div>
        <Button onClick={() => setView('upload')} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-1" /> Novo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-10 text-center">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-700 font-medium mb-1">Nenhum currículo enviado</p>
              <p className="text-sm text-slate-500 mb-4">Seu histórico aparecerá aqui.</p>
              <Button onClick={() => setView('upload')} className="bg-emerald-600 hover:bg-emerald-700">Enviar currículo</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {resumes.map((r) => {
                const s = statusMap[r.status] || statusMap.uploaded
                const Icon = s.icon
                return (
                  <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <button
                      onClick={() => openResume(r.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          Currículo de {new Date(r.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-500">
                          Enviado em {new Date(r.createdAt).toLocaleString('pt-BR')} · atualizado em {new Date(r.updatedAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </button>
                    <Badge className={`${s.color} hover:${s.color} shrink-0`}>{s.label}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => del(r.id)}
                      disabled={deleting === r.id}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
