'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Loader2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'
import { useI18n } from '@/context/i18n-context'

export interface ProfileConflict {
  field: 'currentTitle' | 'field'
  label: string
  current: string
  suggested: string
}

const dismissKey = (resumeId: string) => `griffo_perfil_conflito_ignorado_${resumeId}`

export function wasConflictDismissed(resumeId: string): boolean {
  try {
    return localStorage.getItem(dismissKey(resumeId)) === '1'
  } catch {
    return false
  }
}

export function ProfileConflictPrompt({
  resumeId,
  conflicts,
  onResolved,
}: {
  resumeId: string
  conflicts: ProfileConflict[]
  onResolved: () => void
}) {
  const { t } = useI18n()
  const pc = t.profileConflict
  const [saving, setSaving] = useState(false)

  if (conflicts.length === 0) return null

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(resumeId), '1')
    } catch {
      // Navegador sem armazenamento
    }
    onResolved()
  }

  const apply = async () => {
    setSaving(true)
    try {
      const patch: Record<string, string> = {}
      for (const c of conflicts) patch[c.field] = c.suggested

      const r = await internalFetch('/api/user/professional-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast.error(data.error || pc.updateError)
        return
      }

      toast.success(pc.updateSuccess)
      dismiss()
    } catch {
      toast.error(pc.updateConnectionError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-amber-300 bg-amber-50/60 shadow-sm">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900 text-sm">
              {pc.title}
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {pc.desc.replace('{profileRole}', conflicts.find(c => c.field === 'currentTitle')?.current || '').replace('{resumeRole}', conflicts.find(c => c.field === 'currentTitle')?.suggested || '')}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white divide-y divide-amber-100">
          {conflicts.map((c) => (
            <div key={c.field} className="flex items-center gap-3 p-3 text-xs">
              <span className="w-24 shrink-0 font-semibold text-slate-500">{c.label}</span>
              <span className="text-slate-500 line-through truncate">{c.current}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold text-slate-900 truncate">{c.suggested}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={apply}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-xs font-bold"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1" />
            )}
            {saving ? pc.updatingBtn : pc.updateBtn.replace('{role}', conflicts.find(c => c.field === 'currentTitle')?.suggested || '')}
          </Button>
          <Button
            variant="outline"
            onClick={dismiss}
            disabled={saving}
            className="text-xs font-semibold border-slate-300"
          >
            <X className="w-3.5 h-3.5 mr-1" /> {pc.keepBtn}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
