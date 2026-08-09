# Plano de Globalização — Português, Inglês e Espanhol

**Data:** 2026-08-09
**Contexto:** a plataforma será divulgada com anúncios em inglês, espanhol e português
**Commit analisado:** `8eb051a`

---

## Resumo

**A interface é trilíngue. O produto não é.**

`src/lib/i18n/index.ts` tem 747 linhas com pt/en/es completos para a interface — trabalho já feito e bem feito. Mas **nenhuma rota de IA recebe o idioma do usuário**, e três dos quatro prompts fixam português explicitamente.

Na prática, hoje um usuário americano vê o site em inglês, paga em dólar, sobe um currículo em inglês — e recebe o **currículo reescrito em português**. Isso não é um defeito de tradução: são dois dos três mercados-alvo sem produto entregável.

O custo de operar em três idiomas é **praticamente zero** — os modelos Claude tratam pt/en/es nativamente pelo mesmo preço. O que falta é encanamento, não capacidade.

**Os itens 1 a 3 deste plano são bloqueantes para a divulgação.** Divulgar em inglês e espanhol com a reescrita saindo em português desperdiça a aquisição: o usuário chega, paga e só então descobre que o produto não serve para ele. Em divulgação paga isso queima também o custo por clique.

> **Terminologia adotada:** *vaga de emprego* é a oferta de trabalho que o candidato quer disputar; *anúncio* e *divulgação* referem-se à publicidade da plataforma.

---

## 1. Idioma não chega às rotas de IA — bloqueante

### Diagnóstico

Nenhuma referência a `lang`, `locale` ou `language` em `analyze/route.ts` ou `rewrite/route.ts`. O `schema.prisma` não tem campo de idioma no usuário — a escolha vive apenas no `localStorage` do navegador (`i18n-context.tsx:26`).

Idioma fixado em português nos prompts:

| Local | Texto |
|---|---|
| `rewrite/route.ts:80` | `"Responda sempre em Português (pt-BR)."` |
| `career-orientation/route.ts:67` | `"(em Português PT-BR)"` |
| `support/chat/route.ts:58` | `"Seja sempre cortês, profissional, direto e em português do Brasil."` |
| `analyze/route.ts` | **Nenhuma diretriz** — mas o prompt inteiro está em português |

### Comportamento atual por rota

- **Reescrita** — sempre em português, independente do idioma do currículo. Inutilizável fora do Brasil.
- **Análise** — **comportamento indefinido**: o modelo pode seguir o idioma do prompt (português) ou o do conteúdo (inglês), ou misturar. Imprevisível é pior que errado, porque não dá nem para documentar o defeito.
- **Orientação vocacional** — sempre em português.
- **Suporte** — sempre em português.

### Correção

1. Adicionar `language String @default("pt")` ao modelo `User` no `schema.prisma`.
2. Persistir a escolha do seletor de idioma no perfil, além do `localStorage`.
3. Passar o idioma em `AiTaskRequest` e injetar a diretriz nos quatro prompts, substituindo o texto fixo:

```ts
// em vez de: 'Responda sempre em Português (pt-BR).'
const LANG_DIRECTIVE = {
  pt: 'Responda integralmente em Português do Brasil (pt-BR).',
  en: 'Respond entirely in English (en-US).',
  es: 'Responde íntegramente en Español (es).',
}
```

4. No cadastro, herdar o idioma detectado por `GET /api/i18n/geo` (a rota já existe e lê `x-vercel-ip-country` / `cf-ipcountry`, com fallback para `accept-language`).

**Esforço:** pequeno. **Impacto:** habilita dois mercados.

---

## 2. Os ATS citados são brasileiros — bloqueante

### Diagnóstico

No `SYSTEM_ANALYZE_PROMPT`, **Gupy aparece 5 vezes** e Catho uma. A Gupy é um ATS brasileiro, irrelevante nos EUA, Espanha ou México.

O problema não é cosmético: as recomendações de palavras-chave são *otimizadas para os filtros da Gupy*. Para um candidato americano isso não é apenas inútil — é **conselho errado**, que pode piorar a triagem dele.

### Correção

Tornar a lista de ATS variável por mercado, derivada do idioma/país:

| Mercado | ATS relevantes |
|---|---|
| pt-BR | Gupy, Catho, Vagas.com, InfoJobs BR + globais |
| es | InfoJobs, Bumeran, Computrabajo, Tecnoempleo + globais |
| en | Workday, Taleo, Greenhouse, Lever, iCIMS, SmartRecruiters, Ashby |
| Globais (todos) | LinkedIn Talent Solutions, Workday, Greenhouse |

O mesmo vale para as plataformas de presença digital sugeridas em `socialAdvice` — Gupy não faz sentido para um candidato em Madri.

**Esforço:** pequeno — extrair a lista para uma constante indexada por idioma.

---

## 3. Modelo de IA e qualidade multilíngue

Os modelos Claude entregam pt/en/es com qualidade equivalente e mesmo preço. Português e espanhol geram ~10–15% mais tokens que inglês para o mesmo texto — na escala prevista, centavos.

**Ressalva sobre o DeepSeek:** a qualidade em português e espanhol é inferior à do inglês. Com o chat de suporte hoje no DeepSeek e com prompt exclusivamente em português, atender em três idiomas por ali merece medição antes de assumir que funciona.

---

## 4. Dinheiro — dois problemas que a operação global agrava

### 4.1 Moeda escolhida pelo cliente (P1-8 da auditoria)

`credits/purchase/route.ts:11` aceita `currency` no corpo da requisição, sem validar contra a geolocalização. Como `priceUsd`/`priceEur` são ~8% mais caros que `priceBrl` no câmbio de referência, qualquer usuário no exterior envia `currency: 'brl'` e paga o preço brasileiro.

Com público brasileiro isso era fuga marginal. **Com público global, passa a ser o comportamento padrão de qualquer usuário atento.**

**Correção:** definir a moeda no servidor a partir da geolocalização; ignorar o campo do cliente.

### 4.2 Receita gravada na moeda errada (P1-7 da auditoria)

`verify-session/route.ts:54` e `webhooks/stripe/route.ts:59` gravam `amount_total / 100` em `CreditTransaction.costBrl` sem conversão. O `amount_total` vem na moeda do checkout.

Com vendas majoritariamente em BRL isso contaminava pouco. **Vendendo em três moedas, o painel financeiro passa a estar sistematicamente errado.**

**Correção:** gravar `currency` e `amountOriginal`; converter na leitura, não na escrita.

### 4.3 Imposto sobre serviço digital — novo, e não é opcional

Vender serviço digital a consumidor na UE obriga a recolher IVA no país do comprador (regime OSS). Nos EUA, as regras de *nexus* variam por estado. **Hoje não há coleta de imposto alguma.**

O Stripe oferece **Stripe Tax**, que calcula e recolhe automaticamente. Precisa ser habilitado e configurado — é decisão comercial e contábil, não de código.

---

## 5. Jurídico — GDPR entra em cena

A auditoria tratou de LGPD (P2-6). Vender a residentes na UE aciona o **GDPR**, mais rigoroso em três pontos que já são lacunas:

| Requisito | Situação atual |
|---|---|
| **Exclusão de dados em até 1 mês** | Não existe `DELETE /api/user` |
| **Portabilidade** | Não existe exportação |
| **Transferência internacional** | Currículos com PII vão para EUA (Anthropic) e **China (DeepSeek)**. A China não tem decisão de adequação — exige cláusulas contratuais padrão ou exclusão do provedor para dados de europeus |
| **Representante na UE (Art. 27)** | Controlador fora da UE que oferece serviços a residentes europeus normalmente precisa designar um |
| **Base legal documentada** | Não há registro de tratamento |

**Consequência prática para a arquitetura:** manter o DeepSeek fora do caminho que processa dado pessoal de europeu deixa de ser preferência técnica e vira exigência regulatória. O roteador (`registry.ts`) precisa considerar a região do usuário na escolha do provedor.

Isso expande a Fase 4 do plano de "LGPD" para "LGPD + GDPR" e eleva sua prioridade.

---

## 6. Infraestrutura — latência

O Supabase está em `aws-1-sa-east-1` (São Paulo). A análise faz **~13 idas e voltas ao banco** (P2-3, sendo 4 redundantes).

| Origem do usuário | Latência por consulta | 13 consultas |
|---|---|---|
| Brasil | ~15 ms | ~0,2 s |
| EUA (leste) | ~120 ms | ~1,6 s |
| Europa | ~200 ms | **~2,6 s** |

Dentro do orçamento de 60 s — que já está apertado — isso come margem justamente onde menos existe. Reduzir de 13 para ~7 consultas (removendo as redundantes de `getProviderRuntimeConfig` e adicionando cache) importa mais num produto global do que num regional.

Considerar também a região de execução das funções Vercel: se estiverem em `iad1` (padrão), cada consulta ao Supabase em São Paulo atravessa o continente.

---

## 7. O que já está pronto

Vale registrar o que **não** precisa ser feito:

- Interface completa em pt/en/es (`lib/i18n/index.ts`, 747 linhas)
- Detecção de país e idioma (`GET /api/i18n/geo`)
- Formatação de preço em BRL/USD/EUR (`getPackagePriceDisplay`)
- Seletor de idioma na interface (`components/ui/language-selector.tsx`)
- Contexto de i18n no cliente (`context/i18n-context.tsx`)

A camada de apresentação está resolvida. O que falta é ligá-la ao produto.

---

## 8. Ordem de execução

| # | Tarefa | Tipo | Bloqueia divulgação? |
|---|---|---|---|
| G1 | Campo `language` no `User` + persistência da escolha | Código | **Sim** |
| G2 | Passar idioma às 4 rotas de IA + diretriz dinâmica | Código | **Sim** |
| G3 | Lista de ATS variável por mercado | Código | **Sim** |
| G4 | Moeda definida no servidor por geolocalização | Código | Não, mas vaza receita |
| G5 | Gravar `currency` + `amountOriginal`; converter na leitura | Código + migração | Não, mas corrompe painel |
| G6 | Habilitar e configurar Stripe Tax | Configuração | Depende do volume |
| G7 | Exclusão de conta e exportação de dados | Código | Risco regulatório |
| G8 | Roteamento de provedor por região (dado de europeu fora da China) | Código | Risco regulatório |
| G9 | Representante na UE, base legal, registro de tratamento | Jurídico | Risco regulatório |
| G10 | Reduzir consultas ao banco por análise (13 → ~7) | Código | Não |
| G11 | Avaliar região de execução das funções Vercel | Configuração | Não |

**G1 a G3 são o mínimo para divulgar.** São pequenos e independentes entre si.

**G6, G9** são decisões comerciais e jurídicas que independem de código e podem correr em paralelo.
