# Griffo — Plataforma global de carreira com IA

> **griffo** · do latim *graphium* — estilo, escrita, pena de escrever.
> Porque seu currículo é a primeira coisa que falam por você antes mesmo de você abrir a boca.

Plataforma de análise de carreira baseada em IA, com atuação em **12 idiomas** e preço regionalizado por país. Recebe um currículo, devolve um laudo técnico com nota 0–10 em 8 dimensões, e — com autorização explícita do usuário — reescreve o currículo otimizado para ATS, gera carta de apresentação, orientação vocacional, análise de presença digital e compatibilidade com uma vaga-alvo. Inclui também um radar de vagas que cruza o perfil profissional com uma coleta própria de oportunidades, e um índice público de temperatura de contratação por país.

## ✨ Funcionalidades

- **Landing + páginas de país** (`/[country]`) nos 12 idiomas suportados, com geo-redirect automático por IP
- **Cadastro + login** com hash scrypt + sessão HMAC — sessões vivem em tabela própria (`Session`), então logout e desativação de conta revogam de verdade, não só apagam o cookie
- **Prévia gratuita** (notas das 8 dimensões, sem diagnóstico) — uma por conta
- **Análise completa** em 8 dimensões (Estrutura, Resumo, Impacto, Habilidades, Experiência, Palavras-chave/ATS, Formação, Linguagem), processada em job assíncrono com progresso real (sobrevive a fechar a aba)
- **Uma compra destrava tudo** para o currículo: laudo, compatibilidade com vaga-alvo, sugestões de mudança pontual, reescrita para ATS, orientação vocacional, radar de vagas, análise de presença digital/redes sociais, carta de apresentação, resumo profissional direcionado e download em PDF
- **Job Radar**: coleta própria de vagas (Greenhouse, Lever, Adzuna, Remotive, RemoteOK, páginas de carreira via JSON-LD, Gupy), deduplicação entre fontes, casamento com o perfil profissional e alerta por e-mail configurável (frequência, relevância mínima)
- **Índice de temperatura de contratação** (`/market-pulse`): série histórica por país a partir de fontes oficiais (BLS JOLTS, Eurostat), sem ranking entre países — cada um comparado só com a própria história
- **Downloads**: laudo em PDF, currículo reescrito em PDF e Markdown
- **Preço por região**: 4 faixas por país (não uma tabela única em real), com piso acima do custo direto medido; Pix habilitável no checkout brasileiro
- **Painel administrativo** (`/admin`): chaves de IA, configuração do sistema, incidentes

## 🛠 Stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** + **Recharts**
- **Prisma ORM** + **PostgreSQL via Supabase**, com Row Level Security habilitado
- **Zustand** (state) · **Zod** (validação)
- **Roteador de IA próprio**, com fallback entre provedores por tipo de tarefa: **Anthropic (Claude)**, **DeepSeek**, **Moonshot (Kimi K3)**, **Google Gemini** — cada chamada registrada em `AiLog` com custo, latência e provedor efetivamente usado
- **Stripe** para cobrança real (cartão global + Pix no Brasil), com webhook idempotente e ledger auditável de crédito
- **Resend** para e-mail transacional (digest do Radar)
- **pdf-lib** (geração de PDF server-side)
- Auth própria (scrypt + HMAC + tabela de sessão) — sem NextAuth

## 🚀 Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env — veja a seção abaixo para o que é obrigatório

# 3. Sincronizar o schema com o banco (Postgres/Supabase)
npm run db:push

# 4. Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

Outros comandos úteis:

```bash
npm run test          # suíte de testes (node --test, sem framework externo)
npm run lint          # eslint
npm run build         # prisma generate + next build
npm run db:rls        # aplica as políticas de RLS (prisma/rls.sql)
npm run db:migrate    # nova migração Prisma
```

## 🔐 Variáveis de ambiente

Veja `.env.example` para a lista completa e comentada. Resumo do que é **obrigatório**:

| Variável | Para quê |
|---|---|
| `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING` | conexão com o banco (pool e direta) |
| `SESSION_SECRET` | assina o cookie de sessão — sem ela, login/cadastro respondem 503 |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` | cobrança |
| Pelo menos uma de `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `MOONSHOT_API_KEY`, `GEMINI_API_KEY` | provedor de IA |
| `CRON_SECRET` | autentica as rotas de cron (`/api/cron/radar`, `/api/cron/dedup`) |

Opcionais notáveis: `ENCRYPTION_KEY` (cifra segredos gravados pelo painel admin), `RESEND_API_KEY`/`RADAR_DIGEST_ENABLED` (envio do digest do Radar, desligado por padrão até validação com usuário real), `GREENHOUSE_BOARDS`/`LEVER_BOARDS`/`CAREER_PAGES`/`ADZUNA_APP_ID`+`ADZUNA_APP_KEY` (fontes de vaga do Job Radar).

## 🌍 Idiomas

`pt en es de fr it ja nl sv zh ar ko` — incluindo suporte a RTL (árabe), hreflang completo e sitemap com rota própria por país/idioma.

## 💳 Preço

Preço por análise varia por faixa de país (não é fixo em real):

| Faixa | Países (exemplos) | Moeda | Análise avulsa |
|---|---|---|---|
| 1 | EUA, Canadá, Reino Unido, Alemanha, França, Japão... | USD | US$ 12,90 |
| 2 | Portugal, Espanha, Itália, Polônia, EAU... | EUR | equivalente a US$ 8,90 |
| 3 | Brasil, México, Argentina, Colômbia... | BRL (Pix disponível) | equivalente a US$ 5,90 |
| 4 | Índia, Indonésia, Nigéria, Vietnã... | INR | equivalente a US$ 3,90 |

Também há pacote de 5 análises com desconto. A fonte única de preço é `src/lib/pricing/catalog.ts` — nenhum valor deve existir fora dali.

## 🗂 Estrutura do projeto (visão parcial)

```
src/
├── app/
│   ├── [country]/               # landing por país/idioma, com geo-redirect
│   ├── api/                     # auth, resume, checkout, radar, hiring-index, admin, cron...
│   ├── admin/                   # painel administrativo
│   ├── ats/                     # páginas de glossário ATS por idioma
│   ├── hiring/                  # landing de captação
│   └── market-pulse/            # índice público de temperatura de contratação
├── components/
│   ├── landing/ auth/ app/ i18n/
├── lib/
│   ├── auth.ts, password.ts, session-store.ts   # autenticação e sessão
│   ├── ai-router/, ai-jobs/                      # roteamento de IA e jobs em background
│   ├── pricing/catalog.ts                        # preço — fonte única
│   ├── jobs/adapters/                            # coleta de vagas (Greenhouse, Lever, Adzuna...)
│   ├── radar/, matching/                         # Job Radar e casamento de perfil
│   ├── hiring-index/                             # índice de temperatura de contratação
│   ├── i18n/                                     # 12 idiomas
│   └── stripe.ts, payments/                       # cobrança
└── prisma/
    └── schema.prisma            # 22 models — User, Resume, AnalysisJob, AiJob, Job, RadarAlert...
```

## 🔒 Segurança & LGPD

- Senhas com **scrypt + salt aleatório**
- Sessões em tabela própria, revogáveis de verdade (logout, desativação de conta)
- **Row Level Security** no Postgres, auditado periodicamente (`prisma/rls.sql`)
- **AuditLog** rastreia ações do usuário; **AiLog** rastreia cada chamada de IA (custo, provedor, latência)
- Segredos sensíveis no banco (chaves de IA, credenciais Stripe) cifrados em repouso via `ENCRYPTION_KEY`
- Consentimento explícito para reescrita, para análise de redes sociais e para transferência internacional de dados (LGPD Art. 33 / GDPR Cap. V)

## ✅ Testes

Suíte com centenas de testes (`node --test`), incluindo casos de segurança (`security-hardening`, `security-pentest`), validação de RLS, e travas que falham propositalmente quando um contrato de preço, i18n ou schema diverge. `tsc --noEmit`, `eslint` e `npm run build` fazem parte do fluxo de verificação antes de qualquer commit.

## 📚 Mais contexto

Este README cobre a visão geral. Para quem for dar continuidade ao projeto:

- `docs/HANDOFF-CONTINUIDADE.md` — estado atual, pendências abertas, o que não quebrar
- `docs/AUDITORIA-EVOLUCAO-GLOBAL.md` — histórico cronológico de decisões e por quê
- `docs/AUDITORIA-SEGURANCA-2026-08.md` — auditoria de segurança

## 📄 Licença

Projeto privado. Todos os direitos reservados.
