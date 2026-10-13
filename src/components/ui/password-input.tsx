'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Campo de senha ou segredo com o botão de olho para conferir o que foi
 * digitado (§2.149). Mesmo comportamento da tela de entrada.
 */
export function PasswordInput({
  className,
  showLabel = 'Mostrar',
  hideLabel = 'Ocultar',
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'type'> & { showLabel?: string; hideLabel?: string }) {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? hideLabel : showLabel
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={cn('pr-10', className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B63E5]"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
