'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Loader2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { internalFetch } from '@/lib/internal-fetch'
import { toast } from 'sonner'

/**
 * "Este currículo é de outra profissão. Atualizo seu perfil?"
 *
 * ## Por que perguntar, e não decidir
 *
 * O Perfil Profissional é um por usuário. Quando chega um currículo de outra
 * área, o perfil passa a descrever outra pessoa profissional — e ele governa a
 * orientação de carreira e a busca de vagas do Radar. Quem enviou um currículo
 * de advogado receberia vagas de biomedicina.
 *
 * Trocar sozinho está fora de questão: o §30 diz que o perfil não muda em
 * silêncio, e um perfil que se reescreve a cada upload apagaria o que a pessoa
 * ajustou à mão. Ignorar também não serve — o perfil errado continuaria
 * decidindo o que ela recebe. Sobra perguntar.
 *
 * ## A recusa é uma resposta, e é lembrada
 *
 * "Manter como está" é legítimo: alguém pode ter dois currículos de verdade e
 * saber muito bem qual perfil quer. Perguntar de novo no mesmo currículo
 * transformaria a resposta dela em nada, então a recusa fica registrada por
 * currículo, no próprio navegador — a decisão é da tela, e não vale a pena uma
 * coluna no banco para guardá-la.
 */

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
  const [saving, setSaving] = useState(false)

  if (conflicts.length === 0) return null

  const dismiss = () => {
    try {
      localStorage.setItem(dismissKey(resumeId), '1')
    } catch {
      // Navegador sem armazenamento: a pergunta volta na próxima visita. É
      // pior que lembrar, e melhor que travar a tela.
    }
    onResolved()
  }

  const apply = async () => {
    setSaving(true)
    try {
      // Só os campos em conflito. Levar junto o resto da sugestão faria a
      // pessoa aceitar mudanças que ela não viu — que é o mesmo defeito de
      // mudar sozinho, disfarçado de confirmação.
      const patch: Record<string, string> = {}
      for (const c of conflicts) patch[c.field] = c.suggested

      const r = await internalFetch('/api/user/professional-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!r.ok) {
        const data = await r.json().catch(() => ({}))
        toast.error(data.error || 'Não foi possível atualizar o perfil.')
        return
      }

      toast.success('Perfil atualizado. O Radar passa a buscar vagas desta área.')
      dismiss()
    } catch {
      toast.error('Erro de conexão ao atualizar o perfil.')
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
              Este currículo parece ser de outra área
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              Seu Perfil Profissional ainda descreve a área anterior. Ele não afeta este
              laudo — que foi feito só a partir do currículo enviado —, mas é ele que
              orienta a carreira e decide{' '}
              <strong>quais vagas o Radar procura para você</strong>.
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
            Atualizar meu perfil
          </Button>
          <Button
            variant="outline"
            onClick={dismiss}
            disabled={saving}
            className="text-xs font-semibold border-slate-300"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Manter como está
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
