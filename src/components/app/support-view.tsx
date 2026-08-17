'use client'

import { useState, useRef, useEffect } from 'react'
import { useNav } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  HelpCircle, Send, Bot, User, Loader2, Sparkles, ShieldCheck,
  CreditCard, FileSearch, FileEdit, Download, CheckCircle2, MessageSquare
} from 'lucide-react'
import { internalFetch } from '@/lib/internal-fetch'
import ReactMarkdown from 'react-markdown'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: string
}

const FAQ_SUGGESTIONS = [
  'Quanto custa e o que vem incluso?',
  'O que é analisado no laudo do currículo?',
  'Como funciona a reescrita em STAR e XYZ?',
  'Como posso baixar meu laudo e currículo?',
  'O que é a análise de Presença Digital e otimização de perfil?',
]

export function SupportView() {
  const { setView } = useNav()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o Assistente Virtual Oficial do Griffo. Estou aqui para ajudar com qualquer dúvida sobre as funcionalidades do sistema, laudos, reescritas e a Análise Completa. Como posso te ajudar hoje?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }))

      const res = await internalFetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      })

      const data = await res.json()
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || 'Desculpe, não consegui obter uma resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, botMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Ocorreu um erro ao conectar com o suporte. Por favor, tente novamente em instantes.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center border border-violet-200 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Suporte & Dúvidas do Griffo</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tire suas dúvidas sobre o funcionamento do sistema, laudos e cobrança.</p>
          </div>
        </div>
      </div>

      {/* QUICK SUGGESTIONS */}
      <Card className="border-slate-200 bg-slate-50/50">
        <CardContent className="p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" /> Perguntas frequentes sugeridas
          </p>
          <div className="flex flex-wrap gap-2">
            {FAQ_SUGGESTIONS.map((faq, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(faq)}
                disabled={loading}
                className="bg-white hover:bg-violet-50 hover:text-violet-900 hover:border-violet-200 text-xs text-slate-700 font-normal h-8"
              >
                {faq}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CHAT WINDOW */}
      <Card className="border-slate-200 shadow-sm flex flex-col h-[520px]">
        <CardHeader className="py-3 px-4 border-b border-slate-100 bg-slate-50/80 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">Atendimento Virtual Griffo</CardTitle>
              <CardDescription className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online · Respostas instantâneas
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200 bg-white">
            Suporte Oficial
          </Badge>
        </CardHeader>

        {/* CHAT MESSAGES SCROLL AREA */}
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-4" ref={scrollRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  m.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-violet-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="space-y-1 min-w-0">
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none prose prose-slate max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-slate-900'
                  }`}
                >
                  {m.sender === 'user' ? (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  ) : (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  )}
                </div>
                <p className={`text-[10px] text-slate-400 px-1 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.timestamp}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 rounded-tl-none text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                Digitando resposta...
              </div>
            </div>
          )}
        </CardContent>

        {/* INPUT FORM */}
        <div className="p-3 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre o sistema ou cobrança..."
              disabled={loading}
              className="flex-1 text-xs sm:text-sm h-10 focus-visible:ring-violet-500"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-violet-600 hover:bg-violet-700 h-10 px-4 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
