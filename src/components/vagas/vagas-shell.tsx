import Image from 'next/image'
import Link from 'next/link'
import { DocumentLanguage } from '@/components/i18n/document-language'

/** Moldura comum das páginas `/vagas`: cabeçalho, chamada para o teste ATS e rodapé. Só português. */
export function VagasShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/60 via-white to-white">
      <DocumentLanguage lang="pt" />
      <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <Link href="/br" className="flex items-center gap-2.5">
            <Image src="/logo-icon.png" alt="GriffoWork" width={110} height={84} className="h-10 w-auto object-contain" />
            <span className="font-extrabold text-[#0B192E] tracking-tight">
              griffo<span className="text-[#0B63E5]">work</span>
            </span>
          </Link>
          <Link href="/vagas" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Vagas por cidade
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 space-y-8">{children}</main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <Link href="/br" className="hover:text-slate-800">GriffoWork</Link> ·{' '}
        <Link href="/privacy?lang=pt" className="hover:text-slate-800">Privacidade</Link>
      </footer>
    </div>
  )
}

/** Chamada para o produto: o visitante veio atrás de vaga, o Griffo prepara o currículo para ela. */
export function ResumeCta() {
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6 space-y-3">
      <h2 className="text-lg font-bold text-[#0B192E]">Antes de se candidatar: o sistema da empresa consegue ler seu currículo?</h2>
      <p className="text-sm text-slate-700">
        A maioria dessas empresas filtra currículos com um ATS antes de alguém ler. Teste grátis, sem cadastro, como o
        seu currículo aparece para esse sistema — e depois veja a nota dele em 8 dimensões.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/ats-check?lang=pt" className="rounded-lg bg-[#0B63E5] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Testar meu currículo grátis
        </Link>
        <Link href="/br" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          Análise completa do currículo
        </Link>
      </div>
    </section>
  )
}
