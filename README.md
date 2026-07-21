# CareerLens — Análise de Currículo com IA

Plataforma de análise e reescrita de currículos baseada nas melhores práticas de RH e LinkedIn Talent Solutions. Recebe um currículo atual, gera laudo técnico com nota 0–10 em 8 dimensões, e (com autorização explícita do usuário) reescreve o currículo otimizado para ATS, disponível para download em PDF e Markdown.

## ✨ Funcionalidades

- **Landing page** pública em português com preços transparentes
- **Cadastro + login** com hash scrypt + sessão HMAC (LGPD compliant)
- **Análise 0–10 em 8 dimensões**: Estrutura, Resumo, Impacto, Habilidades, Experiência, Palavras-chave/ATS, Formação, Linguagem
- **Laudo completo**: radar chart, pontos fortes, pontos de atenção, recomendações, palavras-chave ATS sugeridas
- **Reescrita autorizada**: o usuário marca um checkbox explícito (LGPD) autorizando a IA a reescrever, depois revisa e confirma
- **Downloads**: laudo em PDF, currículo reescrito em PDF e Markdown
- **Planos**: Passe Diário (R$ 19,90), Mensal (R$ 39,90), Anual (R$ 299,90) — com transparência total de custo
- **Preparação Fase 2**: schema já prevê marketplace B2B com `recruiterOptIn` e `profileVisible`

## 🛠 Stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** + **Recharts**
- **Prisma ORM** + **SQLite** (fácil de migrar para Postgres em produção)
- **Zustand** (state) · **Zod** (validação)
- **z-ai-web-dev-sdk** (GLM-4.6 para análise e reescrita)
- **pdf-lib** (geração de PDF server-side)
- Auth própria (scrypt + HMAC) — sem NextAuth, mais simples e segura

## 🚀 Como rodar localmente

```bash
# 1. Instalar dependências
bun install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env e adicione suas credenciais da Z.ai

# 3. Criar o banco de dados
bun run db:push

# 4. Rodar em desenvolvimento
bun run dev
```

Acesse: http://localhost:3000

## 🔐 Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL="file:./db/custom.db"
SESSION_SECRET="sua-chave-secreta-forte-aqui"  # gere com: openssl rand -hex 32
# As credenciais da Z.ai são lidas automaticamente pelo SDK
```

## 📊 Modelo de negócio e custos

Custo real por ciclo (análise + reescrita): **~$0,005 USD** (≈ R$ 0,03)

| Plano | Preço | Custo real | Margem |
|-------|-------|-----------|--------|
| Passe Diário (24h) | R$ 19,90 | R$ 1,08 | 94% |
| Mensal | R$ 39,90 | R$ 9,72 | 76% |
| Anual | R$ 299,90 | R$ 102,06 | 66% |

Pressupostos:
- Tokens por análise: 1.800 in / 1.500 out
- Tokens por reescrita: 2.500 in / 2.200 out
- Preço GLM-4.6: $0,60/1M in · $2,20/1M out
- Storage SQLite: $0,0008/usuário/dia
- Câmbio BRL/USD: 5,4 (atualize periodicamente)

## 🗂 Estrutura do projeto

```
src/
├── app/
│   ├── api/                    # API routes (auth, resume, pricing, etc.)
│   │   ├── auth/{register,login,logout,me}/
│   │   ├── resume/{upload,analyze,rewrite,download,[id]}/
│   │   ├── pricing/
│   │   ├── subscription/create/
│   │   └── user/settings/
│   ├── page.tsx                # Orquestra landing/auth/app
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── landing/                # Landing page pública
│   ├── auth/                   # Login + cadastro
│   └── app/                    # App autenticado (8 telas)
├── lib/
│   ├── auth.ts                 # scrypt + HMAC + session
│   ├── llm.ts                  # Wrapper z-ai-web-dev-sdk + pricing
│   ├── pdf.ts                  # Geração de PDF (laudo + currículo)
│   ├── db.ts                   # Cliente Prisma
│   └── utils.ts
├── store/
│   └── auth.ts                 # Zustand store (auth + nav)
└── prisma/
    └── schema.prisma           # User, Resume, Subscription, AuditLog
```

## 🔒 Segurança & LGPD

- Senhas com **scrypt + salt aleatório** (nunca armazenadas em texto puro)
- Sessões via **cookie httpOnly assinado com HMAC** (não acessível por JS)
- **AuditLog** rastreia todas as ações (register, login, analyze, rewrite, download, etc.)
- **Opt-in explícito** para marketplace B2B (Fase 2) — usuário pode revogar a qualquer momento
- Dados sensíveis (e-mail, telefone) só serão liberados para recrutadores após match aceito (Fase 2)

## 🗺 Roadmap

**Fase 1 (atual)** ✅
- [x] Análise gratuita de currículos
- [x] Reescrita autorizada
- [x] Downloads PDF + Markdown
- [x] Planos com ativação simulada

**Fase 2 (próxima)**
- [ ] Gateway de pagamento real (Stripe/PagSeguro)
- [ ] Marketplace B2B: recrutadores buscam candidatos por score, dimensões e palavras-chave
- [ ] Import direto de PDF/DOCX (não só texto colado)
- [ ] Integração com LinkedIn (import de perfil)

## 📄 Licença

Projeto privado. Todos os direitos reservados.
