# Plano de melhorias derivadas do `career-ops`

**Data:** 2026-09-18
**Commit base:** `bc5c764`
**Origem:** análise do repositório aberto [`career-ops-hq/career-ops`](https://github.com/career-ops-hq/career-ops) (MIT), pedida pelo operador

Este documento é o **roteiro** desta frente. Ele não substitui
[`PLANO-MELHORIAS.md`](./PLANO-MELHORIAS.md), que é o roteiro consolidado das
auditorias de agosto — são frentes diferentes, e nenhuma das tarefas aqui
depende daquelas.

---

## O que foi analisado, e o que não se aplica

`career-ops` é uma ferramenta **local-first de CLI** (MIT, Node, v1.33.0): roda
dentro de um AI coding CLI, guarda tudo em arquivos markdown versionáveis
("files are canonical, databases are derived") e não tem servidor no caminho.
A engenharia é boa de verdade — suíte real, CodeQL, guarda de SSRF com
validação no momento do `dns.lookup`, 17 traduções.

Mesmo domínio que o nosso, **modelo oposto**: eles são grátis e para quem roda
`node scan.mjs`; o GriffoWork é SaaS pago, em 12 idiomas, para quem nunca abriu
um terminal. A sobreposição de mercado é pequena; a de conhecimento de domínio
é grande.

Por isso **nada de arquitetura é adotado**. Ficam de fora, de propósito:
arquivos-como-banco, raiz plana com ~200 scripts, distribuição por CLI, pipeline
LaTeX, o auto-updater — e **portar os ~100 providers em bloco** (ver F4).

---

## Ordenação

Por **alavancagem no negócio**, não por esforço nem por tamanho do ganho
técnico. A cadeia de receita é:

```
teste ATS (grátis) → cadastro → prévia das 8 notas → Essencial → Recolocação 90 dias
```

A regra aplicada: primeiro o que segura quem já pagou (o tier de 90 dias tem o
risco de a pessoa sumir na semana 3), depois o que diferencia o que é vendido,
depois o que alimenta o topo do funil, e por último cobertura e higiene.

| ID | Frente | Prioridade | Estado |
|---|---|---|---|
| F1 | Sinal de legitimidade da vaga | P1 | **Fases 1 e 2 feitas** |
| F2 | Loop de aprendizado (desfecho → padrão → calibração) | P1 | **Fase 1 feita** |
| F3 | Endurecer o teste ATS | P2 | Não iniciado |
| F4 | Providers selecionados (10–15, não 100) | P2 | Não iniciado |
| F5 | Sinais de risco da empresa na entrevista | P3 | Não iniciado |
| F6 | SSRF: fechar a janela de DNS rebinding | P4 | Condicional |

---

## F1 — Sinal de legitimidade da vaga · P1

**O que é.** Um sinal determinístico que diz se um anúncio parece uma vaga real
e preenchível agora, ou banco de talentos / anúncio perpétuo / recirculação.

**Por que primeiro.** É o de melhor relação valor/esforço entregável isolado:
não depende de nenhuma outra frente, não gasta IA, não pede campo novo no banco
e usa dados que já estão no `Job` (`companyKey`, `normalizedTitle`,
`publishedAt`, `lastSeenAt`, `description`, `requirements`). Diferencia o Radar,
que é o que sustenta o tier de R$ 79,90.

**A decisão de projeto que importa.** O sinal é **neutro na nota**. No
`career-ops` o bloco G é descrito como "separate, score-neutral signal that
never affects the score"; aqui isso vai um passo além: o resultado **não tem
número nenhum** — é um nível (`ok` / `attention` / `suspect`) mais a lista de
motivos. Um número seria somável à compatibilidade por engano; um nível não é.
A garantia passa a ser estrutural, não disciplinar.

**A armadilha evitada.** `types.ts` já diz: *"Eliminar por dado ausente
transforma silêncio em rejeição"*. Salário ausente é a norma no Brasil, não
sinal de fraude — então **ausência de dado não pontua**. Só pontua o que é
afirmativo: o anúncio dizer que é banco de talentos, continuar aberto muito
além da janela normal, a mesma empresa republicar o mesmo cargo várias vezes.

**Fases.**

| Fase | Escopo | Estado |
|---|---|---|
| 1 | `src/lib/jobs/legitimacy.ts` + testes. Módulo puro, sem banco e sem tela | ✅ feita |
| 2 | Avaliação em lote, ligada ao Radar; banco de talentos sai do lote, o resto é medido | ✅ feita |
| 3 | Decidir a eliminação por inferência com número real; exibir nos 12 idiomas | pendente |

A fase 1 é pura de propósito: a regra fica testável isoladamente antes de
qualquer decisão de produto sobre como mostrar, e o limiar pode ser calibrado
contra dado real antes de virar algo que o cliente vê.

### A fase 2 saiu diferente do planejado, e por quê

Estava escrito aqui "ligar à coleta e **persistir o nível**". Ao escrever, o
plano se mostrou errado para metade dos sinais: `evergreen` depende de `now`
(uma vaga gravada como `ok` no dia 1 vira anúncio perpétuo no dia 120 sem que
nada nela mude) e `recirculated` depende de quantas irmãs já existem, que
cresce. Um nível gravado na coleta estaria desatualizado na leitura seguinte — e
dado errado no banco é pior que dado nenhum, porque parece confiável.

Então **nada é persistido**: o lote é avaliado na leitura, com uma consulta
agregada só para o lote inteiro (`legitimacy.server.ts`). Se um dia for preciso
filtrar por nível em SQL, aí sim vale uma coluna desnormalizada — recalculada na
coleta, com o custo de staleness assumido de olhos abertos. Efeito colateral
bom: sem campo novo no schema, esta fase não depende do operador rodar
`prisma db push`.

### O que foi eliminado, e o que só foi medido

A fase 2 separa as duas coisas que o módulo devolve, e trata cada uma como ela é:

- **`talent_pool` sai do lote do Radar.** É o anúncio declarando que não há
  posição específica — não é inferência nossa, não há o que medir, e avisar
  alguém sobre um banco de talentos é o oposto do "só interromper quando vale a
  pena" que o Radar promete.
- **`evergreen`, `recirculated` e `thin_description` só entram no log.**
  Eliminar por inferência antes de saber o volume é exatamente o que o §2.30
  ("medir antes de automatizar") existe para impedir: com o limiar errado
  ninguém descobre, porque a vaga some do aviso sem deixar rastro. A decisão de
  eliminar espera número real de produção.

O log é agregado por rodada, sem nome de vaga: nome não ajuda a decidir limiar e
só aumenta o que fica gravado sobre quem está procurando emprego.

---

## F2 — Loop de aprendizado · P1

**O que é.** Registrar o desfecho real de cada candidatura, cruzar com a nota
que demos e responder: *as suas candidaturas com nota alta convertem mais, para
você?*. No `career-ops` são três peças — `outcome.mjs` (registra),
`analyze-patterns.mjs` (agrupa rejeições por dimensão) e `calibrate.mjs`
(confere se a nota prevê o desfecho).

**Por que importa mais que cobertura.** Recolocação 90 dias é R$ 79,90 por 90
dias: o risco não é a venda, é o abandono. Um relatório semanal que diz "suas
candidaturas 4.5+ responderam 22%, as 3.5 responderam 4%, e o padrão das
rejeições é senioridade acima da sua" é motivo recorrente de voltar.

**As duas regras de honestidade a copiar literalmente** (são o que separa
analytics confiável de ruído, e estão documentadas no cabeçalho do
`calibrate.mjs`):

1. Candidatura ainda em andamento **não é ponto de dado**. Contar como fracasso
   pune o recente; contar como sucesso lisonjeia tudo. Fica fora de toda taxa e
   é reportada à parte.
2. Nenhuma porcentagem é exibida abaixo do piso amostral. "2 de 3" não é 67%.

Mesma disciplina do piso de 30 vagas por país do §2.127 e do mapa de
contratação — não é regra nova, é a que a casa já usa.

**Onde isto encaixa no que já existe.** Não precisa de modelo novo: o
`RadarAlert` **já é** o par (usuário, vaga), com `@@unique([userId, jobId])`, e
já carrega a faixa que demos (`overallFit`, no vocabulário `OverallFit`), a
recomendação, `seenAt`, `clickedAt` e o feedback 👍/👎 do §30. Falta só o
desfecho — campos aditivos, no mesmo padrão do `Job.category` do §2.126.

**Fases.**

| Fase | Escopo | Estado |
|---|---|---|
| 1 | `src/lib/learning/calibration.ts` + testes. As duas regras de honestidade viram código | ✅ feita |
| 2 | Campos aditivos no `RadarAlert` (`appliedAt`, `outcome`, `outcomeAt`) + captura | pendente |
| 3 | Relatório na tela e no digest semanal, nos 12 idiomas | pendente |

Mesma disciplina da F1, e pelo mesmo motivo: a fase 1 não toca schema, então
não depende do operador rodar `prisma db push` — e é justamente a parte onde
errar é mais caro, porque um número enganoso mostrado a quem pagou é pior que
número nenhum.

**O desfecho é o estágio mais longe alcançado, não o veredito final.** Quem foi
entrevistado e depois recusado grava `interview`, não `rejected`. Para a
pergunta que o módulo faz — a nota previu **tração**? — chegar à conversa é o
desfecho favorável, mesmo que a vaga tenha ido para outra pessoa.

**O que o módulo não é, e está escrito nele:** não é teste de significância.
Com dezenas de candidaturas, e não milhares, qualquer inferência formal seria
teatro. O veredito (`predictive` / `flat` / `inverted` / `insufficient`) é
heurística de painel pessoal, e exige piso amostral **e** margem grande
(15 pontos percentuais) justamente porque uma candidatura vale 20 pontos quando
n = 5.

---

## F3 — Endurecer o teste ATS · P2

`src/lib/ats-check/score.ts` já cobre 13 códigos em 12 idiomas. O
`verify-ats.mjs` deles cobre três dimensões que faltam aqui:

| Checagem | O que pega |
|---|---|
| Texto oculto / *keyword stuffing* | Palavra-chave em branco sobre branco, ou fonte tamanho zero |
| Fonte segura para ATS | Fonte que extrator de PDF não lê de forma confiável |
| Texto embutido em imagem | Currículo bonito que o ATS lê como página em branco |

**Não conflita com o paywall.** A regra escrita no `score.ts` é "aponta o
problema, nunca o conserto". Mais problema detectado é mais motivo de comprar,
desde que o conserto continue pago. A regra não muda.

**Ressalva de escopo.** O deles lê HTML antes de renderizar; o nosso lê texto
extraído de PDF. Fonte e texto-em-imagem precisam da estrutura do arquivo —
aplicável ao PDF que **nós** geramos (como portão de qualidade da saída), nem
sempre ao que o visitante envia.

---

## F4 — Providers selecionados · P2

Temos 7 adapters (`adzuna`, `greenhouse`, `gupy`, `jobbase`, `lever`,
`remote-boards`, `jsonld`). Eles têm ~100, incluindo os ATS corporativos que
faltam — Workday, SmartRecruiters, iCIMS, SuccessFactors, Recruitee, Personio,
Teamtailor, BambooHR, Ashby, Workable, Jobvite, Eightfold, Phenom, Oracle Cloud,
CSOD, Avature — e boards regionais (JustJoin e NoFluffJobs na Polônia, Manfred
na Espanha, GetOnBrd na América Latina, JobStreet, Glints e ITViec na Ásia).

**Por que 10–15 e não 100.** Portar não é o trabalho; manter é. Cada ATS muda
API e quebra paginação, e a assimetria é o que decide: quando um provider quebra
lá, um dev conserta localmente e segue; quando quebra aqui, **um cliente pagante
vê vaga faltando**. Escolher por mix real de países, com verificação de saúde
por provider — a disciplina do §2.30 ("medir antes de automatizar") já vale aqui.

**Licença.** MIT permite o reuso com atribuição. Mas o código é `.mjs` com
JSDoc e teria de virar TypeScript: o valor real não é o código, é o
**conhecimento do endpoint** (formato de URL, paginação, manias de cada API),
que é caro de descobrir sozinho.

---

## F5 — Sinais de risco da empresa na entrevista · P3

`modes/interview-redflag.md` analisa o lado **do entrevistador**: *"mesmo se eu
ganhar esse processo, é seguro entrar nessa empresa?"*. Adjacente ao
interview-prep que já subiu.

Junto vem `templates/protected-grounds.yml` — tabela por jurisdição do que é
pergunta ilegal em entrevista. Para um produto em 12 idiomas isso é diretamente
aproveitável, e é dado, não lógica: acrescentar país é acrescentar linha.

---

## F6 — SSRF: fechar a janela de DNS rebinding · P4 · condicional

`src/lib/url-guard.ts` resolve o nome e confere todos os endereços, e a própria
linha 24 documenta a limitação: o `fetch` do Node resolve o nome **de novo** por
conta, então um nome que responde público-e-depois-privado passa.

O `providers/_ip-guard.mjs` fecha essa janela validando no momento do
`dns.lookup`, com `AsyncLocalStorage` marcando só as requisições do próprio
buscador — assim o loopback continua utilizável no resto do processo e a suíte
não precisa de opt-out por env (que desligaria a guarda exatamente onde ela mais
regride).

**Por que P4 e condicional.** Hoje os adapters batem em endpoint fixo; nenhuma
rota busca URL fornecida pelo usuário. Isto vira prioridade **no dia em que
alguma buscar** — não antes.

---

## O que não entra

| Item | Por quê |
|---|---|
| Arquivos como fonte de verdade | O oposto do nosso Postgres; regressão aqui |
| Raiz plana com ~200 scripts | Faz sentido lá por estabilidade de caminho para forks |
| Distribuição por CLI | Nosso público não abre terminal |
| Pipeline LaTeX de currículo | Já geramos PDF; peso sem ganho |
| Auto-updater | Não se aplica a SaaS |
| Portar os ~100 providers | Imposto de manutenção permanente — ver F4 |
