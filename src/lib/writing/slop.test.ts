import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BURSTINESS_FLOOR,
  MIN_WORDS_TO_JUDGE,
  SLOP_SUSPECT_PER_100,
  SLOP_TERMS,
  assessWriting,
  bannedTermsPrompt,
} from './slop'

/**
 * Carta boa: frases de comprimentos muito diferentes, números, nomes próprios,
 * zero enchimento. É o controle — se ela não passar, o detector está quebrado,
 * não o texto.
 */
const CARTA_BOA = `Trabalhei seis anos no fechamento contábil da Alfa Distribuidora.

Quando entrei, o fechamento mensal levava onze dias úteis e atrasava o repasse aos fornecedores. Reorganizei a entrada de notas fiscais, criei uma conferência diária em vez da revisão única do fim do mês, e o prazo caiu para quatro dias. Isso durou.

A vaga pede SAP e conciliação bancária. Uso SAP desde 2019 e concilio as contas da Alfa todo dia de manhã.

Não tenho experiência com IFRS. Posso estudar, mas não vou dizer que já sei.

Estou disponível para começar em janeiro. Meu telefone está no currículo.`

/** Mesma extensão, mesmo assunto, escrita como o modelo escreve sozinho. */
const CARTA_SLOP = `É importante ressaltar que sou um profissional dedicado com vasta experiência na área contábil.

No cenário atual, em um mercado cada vez mais competitivo, busco constantemente agregar valor às organizações por meio de uma abordagem holística dos processos financeiros.

Possuo amplo conhecimento das rotinas de fechamento e sólidos conhecimentos em sistemas de gestão empresarial integrados.

Acredito que minha capacidade de pensar fora da caixa e de transformar desafios em oportunidades pode impulsionar resultados significativos para a empresa.

Em suma, estou em busca de novos desafios que me permitam buscar a excelência e o aprimoramento contínuo das minhas competências profissionais.`

test('a carta honesta passa — o controle não pode acusar', () => {
  const a = assessWriting(CARTA_BOA, 'pt')
  assert.equal(a.judged, true)
  assert.equal(a.level, 'ok', `acusou o controle: ${JSON.stringify(a)}`)
  assert.deepEqual(a.hits, [])
})

test('a carta de enchimento é reprovada', () => {
  const a = assessWriting(CARTA_SLOP, 'pt')
  assert.equal(a.judged, true)
  assert.equal(a.level, 'suspect')
  assert.ok(a.slopPer100 >= SLOP_SUSPECT_PER_100, `densidade ${a.slopPer100}`)
  assert.ok(a.hits.includes('é importante ressaltar'))
})

test('o controle tem MAIS concretude e MAIS variação que o enchimento', () => {
  // A comparação vale mais que qualquer limiar absoluto: se estes dois textos
  // não se separam nas duas dimensões, as dimensões não medem o que dizem.
  const boa = assessWriting(CARTA_BOA, 'pt')
  const ruim = assessWriting(CARTA_SLOP, 'pt')
  assert.ok(boa.concretePer100 > ruim.concretePer100)
  assert.ok(boa.burstiness > ruim.burstiness)
})

test('TEXTO CURTO NÃO ACUSA — dado insuficiente não é acusação', () => {
  const a = assessWriting('Sou analista. Trabalho com contas. Gosto de números.', 'pt')
  assert.equal(a.judged, false)
  assert.equal(a.level, 'ok')
})

test('o piso de palavras não exclui uma carta de verdade', () => {
  // A carta tem 220–350 palavras por especificação do prompt. Um piso acima
  // disso tornaria o detector decorativo.
  assert.ok(MIN_WORDS_TO_JUDGE < 220)
})

test('vazio e nulo não explodem nem acusam', () => {
  for (const v of [null, undefined, '', '   ']) {
    const a = assessWriting(v, 'pt')
    assert.equal(a.judged, false)
    assert.equal(a.level, 'ok')
  }
})

test('"como IA" reprova sozinho, sem depender de densidade', () => {
  const texto = `${CARTA_BOA}\n\nComo uma IA, não posso garantir a veracidade destas informações.`
  assert.equal(assessWriting(texto, 'pt').level, 'suspect')
})

test('"não apenas X, mas também Y" é detectado como estrutura', () => {
  const texto = `${CARTA_BOA}\n\nBusco não apenas crescer na carreira, mas também contribuir com o time.`
  assert.ok(assessWriting(texto, 'pt').structures.includes('nao-apenas'))
})

test('variação de frase separa prosa humana de prosa plana', () => {
  // Oito frases do mesmo tamanho: nenhuma pessoa escreve assim.
  const plano = Array.from({ length: 10 }, (_, i) => `A equipe fez o processo numero ${i} com cuidado.`).join(' ')
  assert.ok(assessWriting(plano, 'pt').burstiness < BURSTINESS_FLOOR)
})

test('inglês e espanhol têm léxico próprio e funcionam', () => {
  const en = `I am passionate about data and analytics in the modern enterprise environment.
    I have a proven track record of delivery and I am extremely detail-oriented in everything.
    I am a team player who likes to think outside the box and hit the ground running quickly.
    In summary, I would leverage my skills to deliver best-in-class results for the organisation.
    This is a cutting-edge role and I would love to embark on it with your growing team.`
  const es = `Soy un profesional dedicado con amplia experiencia en el sector administrativo.
    Cabe destacar que tengo amplios conocimientos y sólidos conocimientos de gestión.
    En un mercado cada vez más competitivo busco aportar valor con un enfoque holístico.
    En resumen, estoy en busca de nuevos desafíos que me permitan buscar la excelencia.
    Es importante resaltar mi pasión por los desafíos y mi capacidad de pensar fuera de la caja.`
  assert.equal(assessWriting(en, 'en').level, 'suspect')
  assert.equal(assessWriting(es, 'es').level, 'suspect')
})

test('VOCABULÁRIO PROFISSIONAL DE VERDADE NÃO ESTÁ NO LÉXICO', () => {
  // Acusar "otimizar" num currículo de desenvolvedor ou "liderar" num de
  // gestor trocaria detecção de clichê por censura de vocabulário.
  const legitimos = ['otimizar', 'liderar', 'gerenciar', 'implementar', 'resiliência', 'negociar']
  for (const lang of ['pt', 'en', 'es'] as const) {
    for (const termo of legitimos) {
      assert.ok(
        !SLOP_TERMS[lang].some((t) => t.toLowerCase() === termo.toLowerCase()),
        `"${termo}" não pode estar no léxico ${lang}`
      )
    }
  }
})

test('nenhum termo do léxico é curto a ponto de casar dentro de outra palavra', () => {
  // "IA" ou "por" no léxico casariam em metade das palavras do texto.
  for (const lang of ['pt', 'en', 'es'] as const) {
    for (const t of SLOP_TERMS[lang]) {
      assert.ok(t.length >= 6, `"${t}" (${lang}) é curto demais para ser específico`)
    }
  }
})

test('a lista de proibidos do prompt cita todos os termos do idioma', () => {
  for (const lang of ['pt', 'en', 'es'] as const) {
    const prompt = bannedTermsPrompt(lang)
    for (const t of SLOP_TERMS[lang]) {
      assert.ok(prompt.includes(t), `"${t}" ficou de fora do prompt ${lang}`)
    }
  }
})

test('o texto que o prompt proíbe é exatamente o que o detector acusa', () => {
  // Se as duas listas divergirem, o prompt pede uma coisa e a medição cobra
  // outra, e ninguém percebe. Cada termo é verificado sozinho: em bloco, um
  // termo que fosse subconjunto de outro se esconderia atrás dele.
  for (const lang of ['pt', 'en', 'es'] as const) {
    for (const termo of SLOP_TERMS[lang]) {
      assert.ok(
        assessWriting(`Texto qualquer ${termo} e mais texto.`, lang).hits.includes(termo),
        `${lang}: o prompt proíbe "${termo}" mas o detector não o acusa`
      )
    }
  }
})

test('clichê em texto curto NÃO some do relatório', () => {
  // O piso protege a inferência (densidade, variação), não o fato literal.
  // Descartar o achado junto com a inferência perderia informação real.
  const curto = 'É importante ressaltar que sou dedicado.'
  const a = assessWriting(curto, 'pt')
  assert.equal(a.judged, false)
  assert.equal(a.level, 'ok', "'ok' aqui significa não avaliado")
  assert.deepEqual(a.hits, ['é importante ressaltar'])
})

test('"COMO IA" (imperfeito de IR) NÃO é o modelo falando de si', () => {
  // "Expliquei como ia conduzir a migração" é português honesto e comum.
  // Como este achado reprova sozinho, ignorar a caixa transformaria a frase
  // mais banal do mundo em acusação de texto gerado.
  const honesto = `${CARTA_BOA}\n\nExpliquei à diretoria como ia conduzir a migração dos sistemas.`
  const a = assessWriting(honesto, 'pt')
  assert.deepEqual(a.structures, [])
  assert.equal(a.level, 'ok')
})

test('a sigla em maiúscula continua sendo detectada', () => {
  for (const frase of ['Como uma IA, não posso garantir isso.', 'Como IA, devo avisar.', 'As an AI language model, I cannot.']) {
    const a = assessWriting(`${CARTA_BOA}\n\n${frase}`, 'pt')
    assert.ok(a.structures.includes('como-ia'), `não pegou: ${frase}`)
  }
})

test('CARTA DENSA EM SIGLAS É A MAIS CONCRETA, NÃO A MENOS', () => {
  // AWS, ETL, SAP, CRM ficavam fora da concretude porque a regra exigia
  // maiúscula seguida de minúscula. O efeito era o inverso do pretendido: a
  // carta que cita os sistemas que a pessoa opera media concretude zero.
  const tecnica = `Atuo com AWS, ETL e SQL em pipelines de dados corporativos há seis anos.
Migrei o ERP da empresa para SAP e integrei o CRM usando REST e SOAP.
Construí o processo de triagem interno e mantive os contratos entre os serviços.
Conheço o ciclo completo, da ingestão à entrega para as áreas de negócio.
Posso começar em janeiro e estou disponível para conversar quando for melhor.`
  const a = assessWriting(tecnica, 'pt')
  assert.ok(a.concretePer100 > 0, 'concretude zero numa carta cheia de sistemas')
  assert.deepEqual(a.hits, [])
})

test('título gritado não vira sigla', () => {
  // O teto de seis letras existe para isto: "EXPERIÊNCIA PROFISSIONAL" é
  // formatação, não fato concreto.
  const a = assessWriting(`EXPERIENCIA PROFISSIONAL\n${CARTA_BOA}`, 'pt')
  const b = assessWriting(CARTA_BOA, 'pt')
  assert.equal(a.concretePer100 > 0, b.concretePer100 > 0)
})

test('FRASE CURTA CONTA — é o que a variação existe para premiar', () => {
  // Descartá-las tirava os valores baixos da distribuição e reduzia a
  // variância, empurrando texto humano para 'suspect'.
  const comCurtas = `Trabalhei na Alfa. Foi bom. Aprendi muito sobre fechamento contábil e conciliação.
Depois mudei para a Beta, onde assumi a área inteira de contas a pagar sozinho.
Deu certo. O prazo caiu de onze dias para quatro, e ficou assim por três anos.
Quero voltar para o operacional. Estou disponível em janeiro.`
  const a = assessWriting(comCurtas, 'pt')
  assert.equal(a.sentences, 8, 'as frases de duas palavras precisam ser contadas')
  assert.ok(a.burstiness > 0.7, `variação subestimada: ${a.burstiness}`)
})

test('uma palavra ainda não é frase', () => {
  // "S.A." e "Dr." quebram frase onde não há frase. O fragmento de UMA
  // palavra que sobra ("A.", "Delta.") inventaria variação que o autor não
  // escreveu, então continua fora — só o piso de duas é que baixou.
  const texto = 'Alfa Ltda. Beta S.A. Gama Dr. Delta.'
  const brutas = (texto.match(/[^.!?\n]+[.!?]*/g) || []).length
  assert.equal(brutas, 5)
  assert.equal(assessWriting(texto, 'pt').sentences, 3, 'os dois fragmentos de uma palavra ficam fora')
})
