import test from 'node:test'
import assert from 'node:assert/strict'
import { levelFor, scoreAtsReadability } from './score'

const GOOD = `Maria Souza
maria.souza@email.com | (11) 98765-4321 | linkedin.com/in/mariasouza
São Paulo, SP

Resumo
Analista administrativa com 8 anos de experiência em rotinas financeiras e atendimento.

Experiência Profissional
Empresa Alfa Ltda — Analista Administrativa (2019 – 2025)
- Reduzi em 30% o prazo de fechamento mensal reorganizando o fluxo de notas fiscais.
- Atendi mais de 200 clientes por mês com índice de satisfação de 95%.
- Implantei controle de contas a pagar em planilha, eliminando atrasos de pagamento.
Empresa Beta S.A. — Assistente Administrativo (2016 – 2019)
- Organizei o arquivo de contratos e a agenda de três diretores.
- Conciliei extratos bancários diariamente e apoiei a auditoria anual.

Formação
Bacharelado em Administração — Universidade Paulista (2012 – 2016)

Habilidades
Excel avançado, SAP, conciliação bancária, contas a pagar e receber, atendimento ao cliente,
organização de documentos, emissão de notas fiscais, rotinas de departamento pessoal.

Idiomas
Inglês intermediário, espanhol básico.
${'Participei de projetos de melhoria contínua e treinamentos internos sobre processos. '.repeat(8)}`

test('currículo bem estruturado passa como bom', () => {
  const r = scoreAtsReadability(GOOD)
  assert.equal(r.level, 'good', JSON.stringify(r.issues))
  assert.equal(r.issues.length, 0, JSON.stringify(r.issues))
  assert.equal(r.score, 100)
})

test('PDF sem texto é risco e só traz o problema crítico', () => {
  const r = scoreAtsReadability('')
  assert.equal(r.level, 'risk')
  assert.deepEqual(r.issues.map((i) => i.code), ['no_text'])
  assert.ok(r.score <= 5)
})

test('sem e-mail e sem seção de experiência são críticos e vêm primeiro', () => {
  const text = GOOD.replace('maria.souza@email.com', '').replace('Experiência Profissional', 'Trabalhos')
  const r = scoreAtsReadability(text)
  const codes = r.issues.map((i) => i.code)
  assert.ok(codes.includes('no_email'))
  assert.ok(codes.includes('no_experience_section'))
  assert.equal(r.issues[0].severity, 'critical')
  assert.equal(r.score, 100 - 15 - 12)
})

test('glifos ilegíveis de ícones são apontados', () => {
  const r = scoreAtsReadability(GOOD + '\n' + '\uF0B7 '.repeat(6))
  assert.ok(r.issues.some((i) => i.code === 'garbled_chars'))
})

test('layout em colunas é suspeito quando quase tudo é linha curtíssima', () => {
  const cols = Array.from({ length: 40 }, (_, i) => `Item ${i}`).join('\n')
  const r = scoreAtsReadability(GOOD.slice(0, 200) + '\n' + cols)
  assert.ok(r.issues.some((i) => i.code === 'columns_suspected'))
})

test('intervalo de anos não conta como telefone', () => {
  const text = GOOD.replace('(11) 98765-4321', '')
  const r = scoreAtsReadability(text)
  assert.ok(r.issues.some((i) => i.code === 'no_phone'))
})

test('reconhece seções em inglês e espanhol', () => {
  const en = GOOD.replace('Experiência Profissional', 'Work Experience')
    .replace('Formação', 'Education').replace('Habilidades', 'Skills')
  assert.equal(scoreAtsReadability(en).issues.length, 0)
  const es = GOOD.replace('Experiência Profissional', 'Experiencia Laboral')
    .replace('Formação', 'Formación Académica').replace('Habilidades', 'Conocimientos')
  assert.equal(scoreAtsReadability(es).issues.length, 0)
})

test('faixas de nível', () => {
  assert.equal(levelFor(80), 'good')
  assert.equal(levelFor(79), 'attention')
  assert.equal(levelFor(60), 'attention')
  assert.equal(levelFor(59), 'risk')
})

test('reconhece seções em alemão, francês, japonês, coreano, chinês e árabe', () => {
  const heads: Record<string, [string, string, string]> = {
    de: ['Berufserfahrung', 'Ausbildung', 'Kenntnisse'],
    fr: ['Expérience professionnelle', 'Formation', 'Compétences'],
    ja: ['職務経歴', '学歴', 'スキル'],
    ko: ['경력 사항', '학력', '기술'],
    zh: ['工作经历', '教育背景', '专业技能'],
    ar: ['الخبرة العملية', 'التعليم', 'المهارات'],
  }
  for (const [lang, [exp, edu, sk]] of Object.entries(heads)) {
    const text = GOOD.replace('Experiência Profissional', exp).replace('Formação', edu).replace('Habilidades', sk)
    const codes = scoreAtsReadability(text).issues.map((i) => i.code)
    assert.ok(!codes.includes('no_experience_section'), `${lang} experiência`)
    assert.ok(!codes.includes('no_education_section'), `${lang} formação`)
    assert.ok(!codes.includes('no_skills_section'), `${lang} habilidades`)
  }
})

test('japonês e chinês sem espaços não são tratados como currículo curto', () => {
  const zh = '工作经历\n' + '负责门店销售与客户服务，提升业绩并管理库存和团队排班工作。'.repeat(12) +
    '\n教育背景\n北京大学 2012 - 2016\n专业技能\n销售，客户服务\nwang@example.com 13800138000'
  const codes = scoreAtsReadability(zh).issues.map((i) => i.code)
  assert.ok(!codes.includes('too_short'), JSON.stringify(codes))
})

/* --- Sinais de manipulação ------------------------------------------------ */

test('currículo honesto não é acusado de manipulação', () => {
  const r = scoreAtsReadability(GOOD)
  const codes = r.issues.map((i) => i.code)
  assert.ok(!codes.includes('keyword_stuffing'))
  assert.ok(!codes.includes('invisible_chars'))
  assert.ok(!codes.includes('hidden_text_suspected'))
})

test('termo empilhado dezenas de vezes é acusado, e reprova', () => {
  const stuffed = GOOD + '\n' + Array(40).fill('javascript').join(' ')
  const r = scoreAtsReadability(stuffed)
  const issue = r.issues.find((i) => i.code === 'keyword_stuffing')
  assert.ok(issue, 'deveria acusar empilhamento')
  assert.equal(issue!.severity, 'critical')
  assert.ok(r.score < scoreAtsReadability(GOOD).score, 'empilhar tem que BAIXAR a nota, não subir')
})

// A razão de existir da checagem: antes, empilhar palavra-chave era
// recompensado, porque o texto está lá e o robô lê.
test('empilhar palavra-chave nunca melhora a nota', () => {
  const base = scoreAtsReadability(GOOD).score
  const comLixo = scoreAtsReadability(GOOD + '\n' + Array(60).fill('gestao').join(' ')).score
  assert.ok(comLixo <= base)
})

test('repetição natural de um termo do ramo não acusa', () => {
  // "administrativa" aparece várias vezes no currículo honesto por ser o
  // cargo da pessoa — isso é ênfase legítima, não empilhamento.
  const r = scoreAtsReadability(GOOD)
  assert.ok(!r.issues.some((i) => i.code === 'keyword_stuffing'))
})

test('poucos caracteres invisíveis são acidente de copiar-e-colar, não acusam', () => {
  const r = scoreAtsReadability(GOOD.replace('Resumo', 'Res​umo'))
  assert.ok(!r.issues.some((i) => i.code === 'invisible_chars'))
})

test('muitos caracteres invisíveis acusam', () => {
  const r = scoreAtsReadability(GOOD + '​'.repeat(50))
  const issue = r.issues.find((i) => i.code === 'invisible_chars')
  assert.ok(issue)
  assert.equal(issue!.severity, 'critical')
})

test('densidade impossível por página acusa texto escondido', () => {
  const denso = GOOD + '\n' + Array(3000).fill('palavra').join(' ')
  const r = scoreAtsReadability(denso, { pages: 1 })
  assert.ok(r.issues.some((i) => i.code === 'hidden_text_suspected'))
})

// Mesma regra do resto da casa: dado ausente não acusa. Texto colado não tem
// páginas, e não pode ser punido por isso.
test('sem contagem de páginas, a densidade nunca acusa', () => {
  const denso = GOOD + '\n' + Array(3000).fill('palavra').join(' ')
  assert.ok(!scoreAtsReadability(denso).issues.some((i) => i.code === 'hidden_text_suspected'))
})

test('currículo longo e legítimo em várias páginas não acusa densidade', () => {
  const r = scoreAtsReadability(GOOD + '\n' + Array(800).fill('experiencia relevante').join(' '), {
    pages: 3,
  })
  assert.ok(!r.issues.some((i) => i.code === 'hidden_text_suspected'))
})
