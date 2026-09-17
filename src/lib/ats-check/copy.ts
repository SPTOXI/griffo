import type { AtsIssueCode, AtsLevel } from './score'
import { LANGUAGES, type Language } from '../i18n/types'

/**
 * O teste é GLOBAL: existe nos 12 idiomas do produto e só cita sistemas de
 * triagem usados no mundo todo. ATS regionais têm as próprias páginas em
 * `/ats/*` e não aparecem aqui.
 */
export const ATS_CHECK_LANGS = LANGUAGES
export type AtsCheckLang = Language

export function isAtsCheckLang(v: string | null | undefined): v is AtsCheckLang {
  return (LANGUAGES as readonly string[]).includes(String(v))
}

/** Caminho neutro, igual em todos os idiomas (o idioma vai em `?lang=`). */
export const ATS_CHECK_PATH = '/ats-check'
/** Caminho antigo, só para redirecionar. */
export const ATS_CHECK_LEGACY_PATH = '/verificar-curriculo'

/** Os sistemas citados em todos os idiomas — todos de uso global. */
export const GLOBAL_ATS_NAMES = 'Workday, Greenhouse, Lever, Taleo, iCIMS'

export interface AtsCheckCopy {
  metaTitle: string
  metaDescription: string
  badge: string
  title: string
  subtitle: string
  bullets: string[]
  uploadCta: string
  uploadHint: string
  pasteToggle: string
  pastePlaceholder: string
  pasteCta: string
  checking: string
  privacy: string
  scoreLabel: string
  levels: Record<AtsLevel, { title: string; text: string }>
  issuesTitle: string
  noIssues: string
  severity: { critical: string; warning: string; tip: string }
  issues: Record<AtsIssueCode, { title: string; why: string }>
  nextTitle: string
  nextText: string
  nextCta: string
  shareCta: string
  shareText: string
  copied: string
  limitTitle: string
  limitText: string
  errorGeneric: string
  errorTooLarge: string
  errorNotPdf: string
  errorRate: string
  bannerTitle: string
  bannerText: string
  bannerCta: string
  faq: { q: string; a: string }[]
}

const pt: AtsCheckCopy = {
  metaTitle: 'Teste ATS de currículo grátis e sem cadastro | GriffoWork',
  metaDescription:
    'Descubra em segundos se sistemas de triagem como Workday, Greenhouse, Lever e Taleo conseguem ler seu currículo. Grátis, sem cadastro, e o arquivo não é guardado.',
  badge: 'Grátis · sem cadastro',
  title: 'Seu currículo passa no filtro ATS?',
  subtitle:
    'Mais da metade das vagas passa primeiro por um sistema de triagem (ATS). Se ele não consegue ler o seu currículo, nenhum recrutador chega a ver. Teste agora.',
  bullets: [GLOBAL_ATS_NAMES, 'Resultado em segundos', 'O arquivo não é guardado'],
  uploadCta: 'Enviar currículo em PDF',
  uploadHint: 'PDF de até 5 MB',
  pasteToggle: 'Prefiro colar o texto',
  pastePlaceholder: 'Cole aqui o texto do seu currículo…',
  pasteCta: 'Testar texto',
  checking: 'Lendo seu currículo como um ATS lê…',
  privacy: 'Lemos o arquivo só para dar a nota e não guardamos o currículo. Não precisa de conta.',
  scoreLabel: 'Legibilidade para ATS',
  levels: {
    good: { title: 'Seu currículo é bem lido', text: 'O sistema consegue extrair suas informações. Agora o que decide é o conteúdo.' },
    attention: { title: 'Seu currículo perde pontos na triagem', text: 'Parte das informações chega incompleta ao sistema. Isso derruba sua posição no ranking.' },
    risk: { title: 'Alto risco de eliminação automática', text: 'O sistema tem dificuldade para ler seu currículo. Muitas candidaturas param aqui sem ninguém ver.' },
  },
  issuesTitle: 'O que encontramos',
  noIssues: 'Nenhum problema de leitura encontrado.',
  severity: { critical: 'Crítico', warning: 'Atenção', tip: 'Dica' },
  issues: {
    no_text: { title: 'O arquivo não tem texto legível', why: 'É uma imagem ou digitalização. O ATS não enxerga nada — sua candidatura chega vazia.' },
    too_short: { title: 'Currículo curto demais', why: 'Pouco texto significa poucas palavras-chave para o sistema comparar com a vaga.' },
    too_long: { title: 'Currículo longo demais', why: 'O excesso dilui as palavras-chave e cansa o recrutador na primeira leitura.' },
    no_email: { title: 'E-mail não encontrado', why: 'Sem e-mail legível, o sistema não consegue preencher seu contato — e ninguém te chama.' },
    no_phone: { title: 'Telefone não encontrado', why: 'Muitos recrutadores ligam ou chamam no WhatsApp antes de marcar entrevista.' },
    no_experience_section: { title: 'Seção de experiência não identificada', why: 'O ATS procura um título como "Experiência Profissional". Sem ele, seus empregos podem não ser lidos.' },
    no_education_section: { title: 'Seção de formação não identificada', why: 'Vagas com requisito de escolaridade filtram quem não tem essa seção clara.' },
    no_skills_section: { title: 'Seção de habilidades não identificada', why: 'É onde o sistema mais procura as palavras-chave da vaga.' },
    no_dates: { title: 'Datas não encontradas', why: 'Sem datas o sistema não calcula seu tempo de experiência, e isso pesa no ranking.' },
    garbled_chars: { title: 'Símbolos ilegíveis no texto', why: 'Ícones e fontes decorativas viram caracteres estranhos na leitura e bagunçam suas informações.' },
    columns_suspected: { title: 'Layout em colunas ou tabelas', why: 'Colunas costumam ser lidas fora de ordem, misturando cargos, datas e empresas.' },
    no_metrics: { title: 'Nenhum resultado em números', why: 'Números (%, valores, quantidades) destacam você de quem só lista tarefas.' },
    no_linkedin: { title: 'Sem link do LinkedIn', why: 'Recrutadores costumam conferir o perfil antes de chamar.' },
  },
  nextTitle: 'Legível é o primeiro passo. E o conteúdo?',
  nextText:
    'Crie sua conta grátis e veja as 8 notas do seu currículo — impacto, clareza, palavras-chave e aderência à vaga que você quer.',
  nextCta: 'Ver minhas 8 notas grátis',
  shareCta: 'Compartilhar',
  shareText: 'Meu currículo tirou {score}/100 no teste ATS (Workday, Greenhouse…). Faça o seu, é grátis:',
  copied: 'Link copiado!',
  limitTitle: 'Você já usou seu teste grátis',
  limitText: 'O teste gratuito é um por pessoa. Crie sua conta grátis e veja as 8 notas do seu currículo — impacto, clareza, palavras-chave e aderência à vaga.',
  errorGeneric: 'Não conseguimos testar agora. Tente de novo em instantes.',
  errorTooLarge: 'O arquivo passa de 5 MB. Exporte o PDF novamente, sem imagens pesadas.',
  errorNotPdf: 'Esse arquivo não é um PDF válido. Envie o PDF ou cole o texto.',
  errorRate: 'Muitos testes seguidos. Aguarde alguns minutos.',
  bannerTitle: 'Seu currículo passa no filtro ATS?',
  bannerText: 'Teste grátis, sem cadastro, em segundos.',
  bannerCta: 'Testar agora',
  faq: [
    { q: 'O que é ATS?', a: 'É o sistema que empresas usam para receber e triar candidaturas, como Workday, Greenhouse, Lever e Taleo. Ele lê o currículo, extrai as informações e ranqueia os candidatos antes de um recrutador olhar.' },
    { q: 'O teste é mesmo grátis?', a: 'Sim. Não precisa de cadastro nem de cartão. O arquivo é lido só para calcular a nota e não fica guardado.' },
    { q: 'Nota alta garante a vaga?', a: 'Não. Ela mostra que o sistema consegue ler seu currículo. O que te coloca no topo é o conteúdo — e é isso que a análise completa avalia.' },
  ],
}

const en: AtsCheckCopy = {
  metaTitle: 'Free ATS Resume Checker — no sign-up | GriffoWork',
  metaDescription:
    'Find out in seconds whether Workday, Greenhouse, Lever, Taleo and other ATS can read your resume. Free, no account, and your file is not stored.',
  badge: 'Free · no sign-up',
  title: 'Can an ATS read your resume?',
  subtitle:
    'Most applications are screened by software (ATS) before a person sees them. If it can’t read your resume, no recruiter will. Check yours now.',
  bullets: [GLOBAL_ATS_NAMES, 'Results in seconds', 'Your file is not stored'],
  uploadCta: 'Upload resume (PDF)',
  uploadHint: 'PDF up to 5 MB',
  pasteToggle: 'Paste text instead',
  pastePlaceholder: 'Paste your resume text here…',
  pasteCta: 'Check text',
  checking: 'Reading your resume the way an ATS does…',
  privacy: 'We read the file only to score it and never store your resume. No account needed.',
  scoreLabel: 'ATS readability',
  levels: {
    good: { title: 'Your resume reads well', text: 'The system can extract your information. Now the content is what decides.' },
    attention: { title: 'Your resume loses points in screening', text: 'Some information reaches the system incomplete, which lowers your ranking.' },
    risk: { title: 'High risk of automatic rejection', text: 'The system struggles to read your resume. Many applications stop here unseen.' },
  },
  issuesTitle: 'What we found',
  noIssues: 'No readability problems found.',
  severity: { critical: 'Critical', warning: 'Warning', tip: 'Tip' },
  issues: {
    no_text: { title: 'No readable text in the file', why: 'It’s an image or scan. The ATS sees nothing — your application arrives empty.' },
    too_short: { title: 'Resume is too short', why: 'Little text means few keywords for the system to match against the job.' },
    too_long: { title: 'Resume is too long', why: 'Extra length dilutes keywords and tires the recruiter on first read.' },
    no_email: { title: 'No email found', why: 'Without a readable email, the system can’t fill in your contact details.' },
    no_phone: { title: 'No phone number found', why: 'Many recruiters call before scheduling an interview.' },
    no_experience_section: { title: 'No experience section detected', why: 'ATS look for a heading like "Work Experience". Without it, your jobs may not be parsed.' },
    no_education_section: { title: 'No education section detected', why: 'Jobs with education requirements filter out resumes without a clear section.' },
    no_skills_section: { title: 'No skills section detected', why: 'It’s where the system looks hardest for the job’s keywords.' },
    no_dates: { title: 'No dates found', why: 'Without dates the system can’t compute your years of experience.' },
    garbled_chars: { title: 'Unreadable symbols in the text', why: 'Icons and decorative fonts turn into junk characters and scramble your data.' },
    columns_suspected: { title: 'Columns or tables layout', why: 'Columns are often read out of order, mixing titles, dates and employers.' },
    no_metrics: { title: 'No results in numbers', why: 'Numbers (%, amounts, counts) set you apart from task lists.' },
    no_linkedin: { title: 'No LinkedIn link', why: 'Recruiters often check your profile before reaching out.' },
  },
  nextTitle: 'Readable is step one. What about the content?',
  nextText: 'Create a free account and see your resume’s 8 scores — impact, clarity, keywords and fit for the job you want.',
  nextCta: 'See my 8 scores for free',
  shareCta: 'Share',
  shareText: 'My resume scored {score}/100 on the ATS check (Workday, Greenhouse…). Try yours free:',
  copied: 'Link copied!',
  limitTitle: 'You’ve already used your free check',
  limitText: 'The free check is one per person. Create a free account to see your resume’s 8 scores — impact, clarity, keywords and job fit.',
  errorGeneric: 'We couldn’t run the check right now. Please try again shortly.',
  errorTooLarge: 'The file is over 5 MB. Export the PDF again without heavy images.',
  errorNotPdf: 'This isn’t a valid PDF. Upload a PDF or paste the text.',
  errorRate: 'Too many checks in a row. Please wait a few minutes.',
  bannerTitle: 'Can an ATS read your resume?',
  bannerText: 'Free check, no sign-up, in seconds.',
  bannerCta: 'Check now',
  faq: [
    { q: 'What is an ATS?', a: 'An applicant tracking system — like Workday, Greenhouse or Lever — receives applications, extracts resume data and ranks candidates before a recruiter looks.' },
    { q: 'Is it really free?', a: 'Yes. No account, no card. The file is read only to compute the score and is not stored.' },
    { q: 'Does a high score guarantee an interview?', a: 'No. It shows the system can read your resume. Content is what puts you on top — that’s what the full analysis evaluates.' },
  ],
}

const es: AtsCheckCopy = {
  metaTitle: 'Verificador ATS de CV gratis y sin registro | GriffoWork',
  metaDescription:
    'Descubre en segundos si Workday, Greenhouse, Lever, Taleo y otros ATS pueden leer tu CV. Gratis, sin registro y el archivo no se guarda.',
  badge: 'Gratis · sin registro',
  title: '¿Tu CV pasa el filtro ATS?',
  subtitle:
    'La mayoría de las postulaciones pasa primero por un sistema de filtrado (ATS). Si no puede leer tu CV, ningún reclutador lo verá. Pruébalo ahora.',
  bullets: [GLOBAL_ATS_NAMES, 'Resultado en segundos', 'El archivo no se guarda'],
  uploadCta: 'Subir CV en PDF',
  uploadHint: 'PDF de hasta 5 MB',
  pasteToggle: 'Prefiero pegar el texto',
  pastePlaceholder: 'Pega aquí el texto de tu CV…',
  pasteCta: 'Probar texto',
  checking: 'Leyendo tu CV como lo lee un ATS…',
  privacy: 'Solo leemos el archivo para calcular la nota y no guardamos tu CV. No necesitas cuenta.',
  scoreLabel: 'Legibilidad ATS',
  levels: {
    good: { title: 'Tu CV se lee bien', text: 'El sistema puede extraer tu información. Ahora decide el contenido.' },
    attention: { title: 'Tu CV pierde puntos en el filtro', text: 'Parte de la información llega incompleta al sistema y baja tu posición.' },
    risk: { title: 'Alto riesgo de descarte automático', text: 'El sistema tiene dificultad para leer tu CV. Muchas postulaciones se quedan aquí sin que nadie las vea.' },
  },
  issuesTitle: 'Lo que encontramos',
  noIssues: 'No encontramos problemas de lectura.',
  severity: { critical: 'Crítico', warning: 'Atención', tip: 'Consejo' },
  issues: {
    no_text: { title: 'El archivo no tiene texto legible', why: 'Es una imagen o escaneo. El ATS no ve nada: tu postulación llega vacía.' },
    too_short: { title: 'CV demasiado corto', why: 'Poco texto significa pocas palabras clave para comparar con la vacante.' },
    too_long: { title: 'CV demasiado largo', why: 'El exceso diluye las palabras clave y cansa al reclutador.' },
    no_email: { title: 'No encontramos correo', why: 'Sin un correo legible, el sistema no puede registrar tu contacto.' },
    no_phone: { title: 'No encontramos teléfono', why: 'Muchos reclutadores llaman antes de agendar una entrevista.' },
    no_experience_section: { title: 'Sección de experiencia no identificada', why: 'El ATS busca un título como "Experiencia Laboral". Sin él, tus empleos pueden no leerse.' },
    no_education_section: { title: 'Sección de formación no identificada', why: 'Las vacantes con requisito de estudios filtran CV sin esa sección clara.' },
    no_skills_section: { title: 'Sección de habilidades no identificada', why: 'Es donde el sistema más busca las palabras clave de la vacante.' },
    no_dates: { title: 'No encontramos fechas', why: 'Sin fechas el sistema no calcula tus años de experiencia.' },
    garbled_chars: { title: 'Símbolos ilegibles en el texto', why: 'Íconos y fuentes decorativas se convierten en caracteres extraños.' },
    columns_suspected: { title: 'Diseño en columnas o tablas', why: 'Las columnas suelen leerse desordenadas y mezclan cargos, fechas y empresas.' },
    no_metrics: { title: 'Ningún resultado en números', why: 'Los números (%, montos, cantidades) te distinguen de quien solo lista tareas.' },
    no_linkedin: { title: 'Sin enlace de LinkedIn', why: 'Los reclutadores suelen revisar el perfil antes de contactar.' },
  },
  nextTitle: 'Legible es el primer paso. ¿Y el contenido?',
  nextText: 'Crea tu cuenta gratis y mira las 8 notas de tu CV: impacto, claridad, palabras clave y ajuste a la vacante.',
  nextCta: 'Ver mis 8 notas gratis',
  shareCta: 'Compartir',
  shareText: 'Mi CV sacó {score}/100 en la prueba ATS (Workday, Greenhouse…). Haz la tuya gratis:',
  copied: '¡Enlace copiado!',
  limitTitle: 'Ya usaste tu prueba gratis',
  limitText: 'La prueba gratuita es una por persona. Crea tu cuenta gratis y mira las 8 notas de tu CV: impacto, claridad, palabras clave y ajuste a la vacante.',
  errorGeneric: 'No pudimos hacer la prueba ahora. Inténtalo de nuevo en unos instantes.',
  errorTooLarge: 'El archivo supera 5 MB. Exporta el PDF de nuevo sin imágenes pesadas.',
  errorNotPdf: 'Este archivo no es un PDF válido. Sube el PDF o pega el texto.',
  errorRate: 'Demasiadas pruebas seguidas. Espera unos minutos.',
  bannerTitle: '¿Tu CV pasa el filtro ATS?',
  bannerText: 'Prueba gratis, sin registro, en segundos.',
  bannerCta: 'Probar ahora',
  faq: [
    { q: '¿Qué es un ATS?', a: 'Es el sistema que las empresas usan para recibir y filtrar postulaciones, como Workday, Greenhouse, Lever o Taleo. Lee el CV, extrae la información y ordena a los candidatos antes de que un reclutador los vea.' },
    { q: '¿La prueba es realmente gratis?', a: 'Sí. Sin registro ni tarjeta. El archivo solo se lee para calcular la nota y no se guarda.' },
    { q: '¿Una nota alta garantiza la entrevista?', a: 'No. Muestra que el sistema puede leer tu CV. Lo que te pone arriba es el contenido, y eso es lo que evalúa el análisis completo.' },
  ],
}

const de: AtsCheckCopy = {
  "metaTitle": "Kostenloser ATS-Lebenslauf-Check ohne Anmeldung | GriffoWork",
  "metaDescription": "Finden Sie in Sekunden heraus, ob Workday, Greenhouse, Lever, Taleo und andere ATS Ihren Lebenslauf lesen können. Kostenlos, ohne Konto, die Datei wird nicht gespeichert.",
  "badge": "Kostenlos · ohne Anmeldung",
  "title": "Kann ein ATS Ihren Lebenslauf lesen?",
  "subtitle": "Die meisten Bewerbungen werden zuerst von einer Software (ATS) geprüft. Kann sie Ihren Lebenslauf nicht lesen, sieht ihn kein Recruiter. Jetzt testen.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "Ergebnis in Sekunden",
    "Datei wird nicht gespeichert"
  ],
  "uploadCta": "Lebenslauf hochladen (PDF)",
  "uploadHint": "PDF bis 5 MB",
  "pasteToggle": "Lieber Text einfügen",
  "pastePlaceholder": "Fügen Sie hier den Text Ihres Lebenslaufs ein…",
  "pasteCta": "Text prüfen",
  "checking": "Wir lesen Ihren Lebenslauf wie ein ATS…",
  "privacy": "Die Datei wird nur zur Bewertung gelesen, Ihr Lebenslauf wird nicht gespeichert. Kein Konto nötig.",
  "scoreLabel": "ATS-Lesbarkeit",
  "levels": {
    "good": {
      "title": "Ihr Lebenslauf ist gut lesbar",
      "text": "Das System kann Ihre Angaben erfassen. Jetzt entscheidet der Inhalt."
    },
    "attention": {
      "title": "Ihr Lebenslauf verliert Punkte im Screening",
      "text": "Ein Teil der Angaben kommt unvollständig an und senkt Ihr Ranking."
    },
    "risk": {
      "title": "Hohes Risiko automatischer Absage",
      "text": "Das System kann Ihren Lebenslauf kaum lesen. Viele Bewerbungen enden hier ungesehen."
    }
  },
  "issuesTitle": "Das haben wir gefunden",
  "noIssues": "Keine Leseprobleme gefunden.",
  "severity": {
    "critical": "Kritisch",
    "warning": "Achtung",
    "tip": "Tipp"
  },
  "issues": {
    "no_text": {
      "title": "Die Datei enthält keinen lesbaren Text",
      "why": "Es ist ein Bild oder Scan. Das ATS sieht nichts – Ihre Bewerbung kommt leer an."
    },
    "too_short": {
      "title": "Lebenslauf zu kurz",
      "why": "Wenig Text bedeutet wenige Schlüsselwörter für den Abgleich mit der Stelle."
    },
    "too_long": {
      "title": "Lebenslauf zu lang",
      "why": "Zu viel Text verwässert die Schlüsselwörter und ermüdet beim ersten Lesen."
    },
    "no_email": {
      "title": "Keine E-Mail gefunden",
      "why": "Ohne lesbare E-Mail kann das System Ihre Kontaktdaten nicht erfassen."
    },
    "no_phone": {
      "title": "Keine Telefonnummer gefunden",
      "why": "Viele Recruiter rufen vor einem Interview an."
    },
    "no_experience_section": {
      "title": "Kein Abschnitt Berufserfahrung erkannt",
      "why": "Das ATS sucht eine Überschrift wie „Berufserfahrung“. Ohne sie werden Ihre Stationen evtl. nicht erfasst."
    },
    "no_education_section": {
      "title": "Kein Abschnitt Ausbildung erkannt",
      "why": "Stellen mit Bildungsanforderungen filtern Lebensläufe ohne klaren Abschnitt aus."
    },
    "no_skills_section": {
      "title": "Kein Abschnitt Kenntnisse erkannt",
      "why": "Hier sucht das System am stärksten nach den Schlüsselwörtern der Stelle."
    },
    "no_dates": {
      "title": "Keine Daten gefunden",
      "why": "Ohne Daten kann das System Ihre Berufsjahre nicht berechnen."
    },
    "garbled_chars": {
      "title": "Unlesbare Symbole im Text",
      "why": "Icons und Zierschriften werden zu Zeichensalat und bringen Ihre Angaben durcheinander."
    },
    "columns_suspected": {
      "title": "Layout mit Spalten oder Tabellen",
      "why": "Spalten werden oft in falscher Reihenfolge gelesen und vermischen Positionen, Daten und Arbeitgeber."
    },
    "no_metrics": {
      "title": "Keine Ergebnisse in Zahlen",
      "why": "Zahlen (%, Beträge, Mengen) heben Sie von reinen Aufgabenlisten ab."
    },
    "no_linkedin": {
      "title": "Kein LinkedIn-Link",
      "why": "Recruiter prüfen oft das Profil, bevor sie sich melden."
    }
  },
  "nextTitle": "Lesbar ist der erste Schritt. Und der Inhalt?",
  "nextText": "Erstellen Sie ein kostenloses Konto und sehen Sie die 8 Bewertungen Ihres Lebenslaufs – Wirkung, Klarheit, Schlüsselwörter und Passung zur Wunschstelle.",
  "nextCta": "Meine 8 Bewertungen gratis ansehen",
  "shareCta": "Teilen",
  "shareText": "Mein Lebenslauf hat {score}/100 im ATS-Check erreicht (Workday, Greenhouse…). Teste deinen kostenlos:",
  "copied": "Link kopiert!",
  "limitTitle": "Sie haben Ihren kostenlosen Check bereits genutzt",
  "limitText": "Der kostenlose Check gilt einmal pro Person. Erstellen Sie ein kostenloses Konto und sehen Sie die 8 Bewertungen Ihres Lebenslaufs.",
  "errorGeneric": "Der Check ist gerade nicht möglich. Bitte gleich erneut versuchen.",
  "errorTooLarge": "Die Datei ist größer als 5 MB. Exportieren Sie das PDF ohne große Bilder neu.",
  "errorNotPdf": "Das ist kein gültiges PDF. Laden Sie ein PDF hoch oder fügen Sie den Text ein.",
  "errorRate": "Zu viele Prüfungen hintereinander. Bitte einige Minuten warten.",
  "bannerTitle": "Kann ein ATS Ihren Lebenslauf lesen?",
  "bannerText": "Kostenloser Check, ohne Anmeldung, in Sekunden.",
  "bannerCta": "Jetzt prüfen",
  "faq": [
    {
      "q": "Was ist ein ATS?",
      "a": "Ein Bewerbermanagementsystem wie Workday, Greenhouse oder Lever. Es empfängt Bewerbungen, liest die Lebensläufe aus und sortiert Kandidaten, bevor ein Recruiter hinschaut."
    },
    {
      "q": "Ist der Check wirklich kostenlos?",
      "a": "Ja. Ohne Konto, ohne Karte. Die Datei wird nur zur Bewertung gelesen und nicht gespeichert."
    },
    {
      "q": "Garantiert eine hohe Punktzahl ein Interview?",
      "a": "Nein. Sie zeigt, dass das System Ihren Lebenslauf lesen kann. Nach oben bringt Sie der Inhalt – genau das bewertet die vollständige Analyse."
    }
  ]
}

const fr: AtsCheckCopy = {
  "metaTitle": "Test ATS de CV gratuit et sans inscription | GriffoWork",
  "metaDescription": "Découvrez en quelques secondes si Workday, Greenhouse, Lever, Taleo et d’autres ATS peuvent lire votre CV. Gratuit, sans compte, le fichier n’est pas conservé.",
  "badge": "Gratuit · sans inscription",
  "title": "Votre CV passe-t-il le filtre ATS ?",
  "subtitle": "La plupart des candidatures passent d’abord par un logiciel de tri (ATS). S’il ne lit pas votre CV, aucun recruteur ne le verra. Testez maintenant.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "Résultat en quelques secondes",
    "Fichier non conservé"
  ],
  "uploadCta": "Envoyer mon CV (PDF)",
  "uploadHint": "PDF jusqu’à 5 Mo",
  "pasteToggle": "Je préfère coller le texte",
  "pastePlaceholder": "Collez ici le texte de votre CV…",
  "pasteCta": "Tester le texte",
  "checking": "Lecture de votre CV comme un ATS…",
  "privacy": "Le fichier est lu uniquement pour la note, votre CV n’est pas conservé. Aucun compte requis.",
  "scoreLabel": "Lisibilité ATS",
  "levels": {
    "good": {
      "title": "Votre CV se lit bien",
      "text": "Le système extrait vos informations. Maintenant, c’est le contenu qui compte."
    },
    "attention": {
      "title": "Votre CV perd des points au tri",
      "text": "Une partie des informations arrive incomplète et fait baisser votre classement."
    },
    "risk": {
      "title": "Risque élevé de rejet automatique",
      "text": "Le système a du mal à lire votre CV. Beaucoup de candidatures s’arrêtent là sans être vues."
    }
  },
  "issuesTitle": "Ce que nous avons trouvé",
  "noIssues": "Aucun problème de lecture trouvé.",
  "severity": {
    "critical": "Critique",
    "warning": "Attention",
    "tip": "Conseil"
  },
  "issues": {
    "no_text": {
      "title": "Le fichier ne contient pas de texte lisible",
      "why": "C’est une image ou un scan. L’ATS ne voit rien : votre candidature arrive vide."
    },
    "too_short": {
      "title": "CV trop court",
      "why": "Peu de texte, c’est peu de mots-clés à comparer avec l’offre."
    },
    "too_long": {
      "title": "CV trop long",
      "why": "L’excès dilue les mots-clés et lasse le recruteur dès la première lecture."
    },
    "no_email": {
      "title": "Aucun e-mail trouvé",
      "why": "Sans e-mail lisible, le système ne peut pas enregistrer vos coordonnées."
    },
    "no_phone": {
      "title": "Aucun téléphone trouvé",
      "why": "Beaucoup de recruteurs appellent avant de fixer un entretien."
    },
    "no_experience_section": {
      "title": "Rubrique expérience non détectée",
      "why": "L’ATS cherche un titre comme « Expérience professionnelle ». Sans lui, vos postes peuvent ne pas être lus."
    },
    "no_education_section": {
      "title": "Rubrique formation non détectée",
      "why": "Les offres avec exigence de diplôme écartent les CV sans rubrique claire."
    },
    "no_skills_section": {
      "title": "Rubrique compétences non détectée",
      "why": "C’est là que le système cherche le plus les mots-clés de l’offre."
    },
    "no_dates": {
      "title": "Aucune date trouvée",
      "why": "Sans dates, le système ne calcule pas vos années d’expérience."
    },
    "garbled_chars": {
      "title": "Symboles illisibles dans le texte",
      "why": "Icônes et polices décoratives deviennent des caractères étranges et brouillent vos informations."
    },
    "columns_suspected": {
      "title": "Mise en page en colonnes ou tableaux",
      "why": "Les colonnes sont souvent lues dans le désordre et mélangent postes, dates et employeurs."
    },
    "no_metrics": {
      "title": "Aucun résultat chiffré",
      "why": "Les chiffres (%, montants, volumes) vous distinguent d’une simple liste de tâches."
    },
    "no_linkedin": {
      "title": "Pas de lien LinkedIn",
      "why": "Les recruteurs consultent souvent le profil avant de contacter."
    }
  },
  "nextTitle": "Lisible, c’est la première étape. Et le contenu ?",
  "nextText": "Créez un compte gratuit et voyez les 8 notes de votre CV : impact, clarté, mots-clés et adéquation au poste visé.",
  "nextCta": "Voir mes 8 notes gratuitement",
  "shareCta": "Partager",
  "shareText": "Mon CV a obtenu {score}/100 au test ATS (Workday, Greenhouse…). Faites le vôtre gratuitement :",
  "copied": "Lien copié !",
  "limitTitle": "Vous avez déjà utilisé votre test gratuit",
  "limitText": "Le test gratuit est limité à un par personne. Créez un compte gratuit pour voir les 8 notes de votre CV.",
  "errorGeneric": "Impossible de lancer le test pour le moment. Réessayez dans un instant.",
  "errorTooLarge": "Le fichier dépasse 5 Mo. Exportez à nouveau le PDF sans images lourdes.",
  "errorNotPdf": "Ce fichier n’est pas un PDF valide. Envoyez un PDF ou collez le texte.",
  "errorRate": "Trop de tests d’affilée. Patientez quelques minutes.",
  "bannerTitle": "Votre CV passe-t-il le filtre ATS ?",
  "bannerText": "Test gratuit, sans inscription, en quelques secondes.",
  "bannerCta": "Tester maintenant",
  "faq": [
    {
      "q": "Qu’est-ce qu’un ATS ?",
      "a": "Un logiciel de suivi des candidatures, comme Workday, Greenhouse ou Lever. Il reçoit les candidatures, extrait les données du CV et classe les candidats avant qu’un recruteur ne les voie."
    },
    {
      "q": "Le test est-il vraiment gratuit ?",
      "a": "Oui. Sans compte ni carte. Le fichier est lu uniquement pour calculer la note et n’est pas conservé."
    },
    {
      "q": "Une bonne note garantit-elle un entretien ?",
      "a": "Non. Elle montre que le système peut lire votre CV. C’est le contenu qui vous place en tête, et c’est ce qu’évalue l’analyse complète."
    }
  ]
}

const it: AtsCheckCopy = {
  "metaTitle": "Test ATS del CV gratuito e senza registrazione | GriffoWork",
  "metaDescription": "Scopri in pochi secondi se Workday, Greenhouse, Lever, Taleo e altri ATS riescono a leggere il tuo CV. Gratis, senza account, il file non viene salvato.",
  "badge": "Gratis · senza registrazione",
  "title": "Il tuo CV supera il filtro ATS?",
  "subtitle": "La maggior parte delle candidature passa prima da un software di selezione (ATS). Se non legge il tuo CV, nessun recruiter lo vedrà. Provalo ora.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "Risultato in pochi secondi",
    "Il file non viene salvato"
  ],
  "uploadCta": "Carica il CV (PDF)",
  "uploadHint": "PDF fino a 5 MB",
  "pasteToggle": "Preferisco incollare il testo",
  "pastePlaceholder": "Incolla qui il testo del tuo CV…",
  "pasteCta": "Verifica il testo",
  "checking": "Leggiamo il tuo CV come un ATS…",
  "privacy": "Leggiamo il file solo per il punteggio e non salviamo il tuo CV. Non serve un account.",
  "scoreLabel": "Leggibilità ATS",
  "levels": {
    "good": {
      "title": "Il tuo CV si legge bene",
      "text": "Il sistema estrae le tue informazioni. Ora conta il contenuto."
    },
    "attention": {
      "title": "Il tuo CV perde punti nella selezione",
      "text": "Parte delle informazioni arriva incompleta e abbassa la tua posizione."
    },
    "risk": {
      "title": "Alto rischio di scarto automatico",
      "text": "Il sistema fatica a leggere il tuo CV. Molte candidature si fermano qui senza essere viste."
    }
  },
  "issuesTitle": "Cosa abbiamo trovato",
  "noIssues": "Nessun problema di lettura trovato.",
  "severity": {
    "critical": "Critico",
    "warning": "Attenzione",
    "tip": "Consiglio"
  },
  "issues": {
    "no_text": {
      "title": "Il file non ha testo leggibile",
      "why": "È un’immagine o una scansione. L’ATS non vede nulla: la candidatura arriva vuota."
    },
    "too_short": {
      "title": "CV troppo corto",
      "why": "Poco testo significa poche parole chiave da confrontare con l’offerta."
    },
    "too_long": {
      "title": "CV troppo lungo",
      "why": "Il testo in eccesso diluisce le parole chiave e stanca il recruiter."
    },
    "no_email": {
      "title": "Nessuna e-mail trovata",
      "why": "Senza un’e-mail leggibile il sistema non registra i tuoi contatti."
    },
    "no_phone": {
      "title": "Nessun telefono trovato",
      "why": "Molti recruiter chiamano prima di fissare un colloquio."
    },
    "no_experience_section": {
      "title": "Sezione esperienza non rilevata",
      "why": "L’ATS cerca un titolo come «Esperienza professionale». Senza, i tuoi impieghi potrebbero non essere letti."
    },
    "no_education_section": {
      "title": "Sezione formazione non rilevata",
      "why": "Le offerte con requisiti di studio escludono i CV senza una sezione chiara."
    },
    "no_skills_section": {
      "title": "Sezione competenze non rilevata",
      "why": "È dove il sistema cerca di più le parole chiave dell’offerta."
    },
    "no_dates": {
      "title": "Nessuna data trovata",
      "why": "Senza date il sistema non calcola i tuoi anni di esperienza."
    },
    "garbled_chars": {
      "title": "Simboli illeggibili nel testo",
      "why": "Icone e font decorativi diventano caratteri strani e confondono i tuoi dati."
    },
    "columns_suspected": {
      "title": "Layout a colonne o tabelle",
      "why": "Le colonne vengono spesso lette in disordine, mescolando ruoli, date e aziende."
    },
    "no_metrics": {
      "title": "Nessun risultato in numeri",
      "why": "I numeri (%, importi, quantità) ti distinguono da un semplice elenco di mansioni."
    },
    "no_linkedin": {
      "title": "Nessun link LinkedIn",
      "why": "I recruiter spesso controllano il profilo prima di contattarti."
    }
  },
  "nextTitle": "Leggibile è il primo passo. E il contenuto?",
  "nextText": "Crea un account gratuito e guarda gli 8 punteggi del tuo CV: impatto, chiarezza, parole chiave e aderenza al ruolo che vuoi.",
  "nextCta": "Vedi i miei 8 punteggi gratis",
  "shareCta": "Condividi",
  "shareText": "Il mio CV ha ottenuto {score}/100 al test ATS (Workday, Greenhouse…). Fai il tuo gratis:",
  "copied": "Link copiato!",
  "limitTitle": "Hai già usato il tuo test gratuito",
  "limitText": "Il test gratuito è uno per persona. Crea un account gratuito per vedere gli 8 punteggi del tuo CV.",
  "errorGeneric": "Non è stato possibile fare il test ora. Riprova tra poco.",
  "errorTooLarge": "Il file supera 5 MB. Esporta di nuovo il PDF senza immagini pesanti.",
  "errorNotPdf": "Questo file non è un PDF valido. Carica un PDF o incolla il testo.",
  "errorRate": "Troppi test di seguito. Attendi qualche minuto.",
  "bannerTitle": "Il tuo CV supera il filtro ATS?",
  "bannerText": "Test gratuito, senza registrazione, in pochi secondi.",
  "bannerCta": "Prova ora",
  "faq": [
    {
      "q": "Che cos’è un ATS?",
      "a": "È il sistema che le aziende usano per ricevere e selezionare candidature, come Workday, Greenhouse o Lever. Legge il CV, estrae le informazioni e ordina i candidati prima che un recruiter li veda."
    },
    {
      "q": "Il test è davvero gratuito?",
      "a": "Sì. Senza account né carta. Il file viene letto solo per calcolare il punteggio e non viene salvato."
    },
    {
      "q": "Un punteggio alto garantisce il colloquio?",
      "a": "No. Mostra che il sistema riesce a leggere il tuo CV. A metterti in cima è il contenuto, ed è ciò che valuta l’analisi completa."
    }
  ]
}

const nl: AtsCheckCopy = {
  "metaTitle": "Gratis ATS-cv-check zonder registratie | GriffoWork",
  "metaDescription": "Ontdek in enkele seconden of Workday, Greenhouse, Lever, Taleo en andere ATS je cv kunnen lezen. Gratis, zonder account, het bestand wordt niet bewaard.",
  "badge": "Gratis · zonder registratie",
  "title": "Komt je cv door het ATS-filter?",
  "subtitle": "De meeste sollicitaties gaan eerst door selectiesoftware (ATS). Kan die je cv niet lezen, dan ziet geen recruiter het. Test het nu.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "Resultaat in seconden",
    "Bestand wordt niet bewaard"
  ],
  "uploadCta": "Cv uploaden (pdf)",
  "uploadHint": "Pdf tot 5 MB",
  "pasteToggle": "Liever tekst plakken",
  "pastePlaceholder": "Plak hier de tekst van je cv…",
  "pasteCta": "Tekst controleren",
  "checking": "We lezen je cv zoals een ATS dat doet…",
  "privacy": "We lezen het bestand alleen voor de score en bewaren je cv niet. Geen account nodig.",
  "scoreLabel": "ATS-leesbaarheid",
  "levels": {
    "good": {
      "title": "Je cv is goed leesbaar",
      "text": "Het systeem haalt je gegevens eruit. Nu beslist de inhoud."
    },
    "attention": {
      "title": "Je cv verliest punten bij de selectie",
      "text": "Een deel van de informatie komt onvolledig binnen en verlaagt je ranking."
    },
    "risk": {
      "title": "Groot risico op automatische afwijzing",
      "text": "Het systeem kan je cv moeilijk lezen. Veel sollicitaties stranden hier ongezien."
    }
  },
  "issuesTitle": "Wat we vonden",
  "noIssues": "Geen leesproblemen gevonden.",
  "severity": {
    "critical": "Kritiek",
    "warning": "Let op",
    "tip": "Tip"
  },
  "issues": {
    "no_text": {
      "title": "Het bestand bevat geen leesbare tekst",
      "why": "Het is een afbeelding of scan. Het ATS ziet niets: je sollicitatie komt leeg binnen."
    },
    "too_short": {
      "title": "Cv te kort",
      "why": "Weinig tekst betekent weinig trefwoorden om met de vacature te vergelijken."
    },
    "too_long": {
      "title": "Cv te lang",
      "why": "Te veel tekst verwatert de trefwoorden en vermoeit de recruiter."
    },
    "no_email": {
      "title": "Geen e-mail gevonden",
      "why": "Zonder leesbaar e-mailadres kan het systeem je contactgegevens niet vastleggen."
    },
    "no_phone": {
      "title": "Geen telefoonnummer gevonden",
      "why": "Veel recruiters bellen voordat ze een gesprek plannen."
    },
    "no_experience_section": {
      "title": "Geen sectie werkervaring herkend",
      "why": "Het ATS zoekt een kop als ‘Werkervaring’. Zonder die kop worden je banen mogelijk niet gelezen."
    },
    "no_education_section": {
      "title": "Geen sectie opleiding herkend",
      "why": "Vacatures met opleidingseisen filteren cv’s zonder duidelijke sectie weg."
    },
    "no_skills_section": {
      "title": "Geen sectie vaardigheden herkend",
      "why": "Hier zoekt het systeem het meest naar de trefwoorden van de vacature."
    },
    "no_dates": {
      "title": "Geen datums gevonden",
      "why": "Zonder datums kan het systeem je jaren ervaring niet berekenen."
    },
    "garbled_chars": {
      "title": "Onleesbare tekens in de tekst",
      "why": "Iconen en sierlettertypen worden vreemde tekens en halen je gegevens door elkaar."
    },
    "columns_suspected": {
      "title": "Opmaak met kolommen of tabellen",
      "why": "Kolommen worden vaak in de verkeerde volgorde gelezen en mengen functies, datums en werkgevers."
    },
    "no_metrics": {
      "title": "Geen resultaten in cijfers",
      "why": "Cijfers (%, bedragen, aantallen) onderscheiden je van een takenlijst."
    },
    "no_linkedin": {
      "title": "Geen LinkedIn-link",
      "why": "Recruiters bekijken vaak je profiel voordat ze contact opnemen."
    }
  },
  "nextTitle": "Leesbaar is stap één. En de inhoud?",
  "nextText": "Maak een gratis account en bekijk de 8 scores van je cv: impact, helderheid, trefwoorden en match met de functie die je wilt.",
  "nextCta": "Bekijk mijn 8 scores gratis",
  "shareCta": "Delen",
  "shareText": "Mijn cv scoorde {score}/100 op de ATS-check (Workday, Greenhouse…). Test de jouwe gratis:",
  "copied": "Link gekopieerd!",
  "limitTitle": "Je hebt je gratis check al gebruikt",
  "limitText": "De gratis check is één per persoon. Maak een gratis account aan en bekijk de 8 scores van je cv.",
  "errorGeneric": "De check lukt nu niet. Probeer het zo opnieuw.",
  "errorTooLarge": "Het bestand is groter dan 5 MB. Exporteer de pdf opnieuw zonder zware afbeeldingen.",
  "errorNotPdf": "Dit is geen geldige pdf. Upload een pdf of plak de tekst.",
  "errorRate": "Te veel checks achter elkaar. Wacht een paar minuten.",
  "bannerTitle": "Komt je cv door het ATS-filter?",
  "bannerText": "Gratis check, zonder registratie, in seconden.",
  "bannerCta": "Nu testen",
  "faq": [
    {
      "q": "Wat is een ATS?",
      "a": "Een sollicitatiesysteem zoals Workday, Greenhouse of Lever. Het ontvangt sollicitaties, haalt gegevens uit het cv en rangschikt kandidaten voordat een recruiter kijkt."
    },
    {
      "q": "Is de check echt gratis?",
      "a": "Ja. Geen account, geen kaart. Het bestand wordt alleen gelezen voor de score en niet bewaard."
    },
    {
      "q": "Garandeert een hoge score een gesprek?",
      "a": "Nee. Het laat zien dat het systeem je cv kan lezen. De inhoud brengt je bovenaan, en die beoordeelt de volledige analyse."
    }
  ]
}

const sv: AtsCheckCopy = {
  "metaTitle": "Gratis ATS-kontroll av CV utan registrering | GriffoWork",
  "metaDescription": "Ta reda på på några sekunder om Workday, Greenhouse, Lever, Taleo och andra ATS kan läsa ditt CV. Gratis, utan konto, filen sparas inte.",
  "badge": "Gratis · utan registrering",
  "title": "Klarar ditt CV ATS-filtret?",
  "subtitle": "De flesta ansökningar granskas först av ett rekryteringssystem (ATS). Kan det inte läsa ditt CV ser ingen rekryterare det. Testa nu.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "Resultat på sekunder",
    "Filen sparas inte"
  ],
  "uploadCta": "Ladda upp CV (PDF)",
  "uploadHint": "PDF upp till 5 MB",
  "pasteToggle": "Klistra in text i stället",
  "pastePlaceholder": "Klistra in texten från ditt CV här…",
  "pasteCta": "Testa texten",
  "checking": "Vi läser ditt CV som ett ATS gör…",
  "privacy": "Vi läser filen bara för att sätta poäng och sparar inte ditt CV. Inget konto behövs.",
  "scoreLabel": "ATS-läsbarhet",
  "levels": {
    "good": {
      "title": "Ditt CV läses bra",
      "text": "Systemet kan hämta dina uppgifter. Nu är det innehållet som avgör."
    },
    "attention": {
      "title": "Ditt CV tappar poäng i urvalet",
      "text": "En del uppgifter kommer fram ofullständiga och sänker din placering."
    },
    "risk": {
      "title": "Hög risk för automatiskt avslag",
      "text": "Systemet har svårt att läsa ditt CV. Många ansökningar stannar här osedda."
    }
  },
  "issuesTitle": "Det här hittade vi",
  "noIssues": "Inga läsproblem hittades.",
  "severity": {
    "critical": "Kritiskt",
    "warning": "Obs",
    "tip": "Tips"
  },
  "issues": {
    "no_text": {
      "title": "Filen har ingen läsbar text",
      "why": "Det är en bild eller skanning. ATS ser ingenting – ansökan kommer fram tom."
    },
    "too_short": {
      "title": "CV:t är för kort",
      "why": "Lite text ger få nyckelord att matcha mot tjänsten."
    },
    "too_long": {
      "title": "CV:t är för långt",
      "why": "För mycket text späder ut nyckelorden och tröttar rekryteraren."
    },
    "no_email": {
      "title": "Ingen e-post hittades",
      "why": "Utan läsbar e-post kan systemet inte registrera dina kontaktuppgifter."
    },
    "no_phone": {
      "title": "Inget telefonnummer hittades",
      "why": "Många rekryterare ringer innan de bokar intervju."
    },
    "no_experience_section": {
      "title": "Ingen rubrik för arbetslivserfarenhet",
      "why": "ATS letar efter en rubrik som ”Arbetslivserfarenhet”. Utan den kanske dina jobb inte läses."
    },
    "no_education_section": {
      "title": "Ingen rubrik för utbildning",
      "why": "Tjänster med utbildningskrav sorterar bort CV utan tydlig rubrik."
    },
    "no_skills_section": {
      "title": "Ingen rubrik för kompetenser",
      "why": "Det är där systemet främst letar efter tjänstens nyckelord."
    },
    "no_dates": {
      "title": "Inga datum hittades",
      "why": "Utan datum kan systemet inte räkna ut dina år av erfarenhet."
    },
    "garbled_chars": {
      "title": "Oläsliga tecken i texten",
      "why": "Ikoner och dekorativa typsnitt blir konstiga tecken och rör till dina uppgifter."
    },
    "columns_suspected": {
      "title": "Layout med kolumner eller tabeller",
      "why": "Kolumner läses ofta i fel ordning och blandar roller, datum och arbetsgivare."
    },
    "no_metrics": {
      "title": "Inga resultat i siffror",
      "why": "Siffror (%, belopp, antal) skiljer dig från en ren uppgiftslista."
    },
    "no_linkedin": {
      "title": "Ingen LinkedIn-länk",
      "why": "Rekryterare kollar ofta profilen innan de hör av sig."
    }
  },
  "nextTitle": "Läsbart är första steget. Och innehållet?",
  "nextText": "Skapa ett gratis konto och se ditt CV:s 8 betyg – effekt, tydlighet, nyckelord och matchning mot jobbet du vill ha.",
  "nextCta": "Se mina 8 betyg gratis",
  "shareCta": "Dela",
  "shareText": "Mitt CV fick {score}/100 i ATS-testet (Workday, Greenhouse…). Testa ditt gratis:",
  "copied": "Länk kopierad!",
  "limitTitle": "Du har redan använt ditt gratistest",
  "limitText": "Det kostnadsfria testet är ett per person. Skapa ett gratis konto och se ditt CV:s 8 betyg.",
  "errorGeneric": "Testet går inte att köra just nu. Försök igen strax.",
  "errorTooLarge": "Filen är större än 5 MB. Exportera PDF:en igen utan tunga bilder.",
  "errorNotPdf": "Det här är ingen giltig PDF. Ladda upp en PDF eller klistra in texten.",
  "errorRate": "För många tester i rad. Vänta några minuter.",
  "bannerTitle": "Klarar ditt CV ATS-filtret?",
  "bannerText": "Gratis test, utan registrering, på sekunder.",
  "bannerCta": "Testa nu",
  "faq": [
    {
      "q": "Vad är ett ATS?",
      "a": "Ett rekryteringssystem som Workday, Greenhouse eller Lever. Det tar emot ansökningar, läser ut CV-uppgifter och rangordnar kandidater innan en rekryterare tittar."
    },
    {
      "q": "Är testet verkligen gratis?",
      "a": "Ja. Inget konto, inget kort. Filen läses bara för att räkna ut poängen och sparas inte."
    },
    {
      "q": "Garanterar höga poäng en intervju?",
      "a": "Nej. De visar att systemet kan läsa ditt CV. Innehållet tar dig till toppen – det är vad den fullständiga analysen bedömer."
    }
  ]
}

const ja: AtsCheckCopy = {
  "metaTitle": "無料ATS履歴書チェック（登録不要） | GriffoWork",
  "metaDescription": "Workday、Greenhouse、Lever、TaleoなどのATSがあなたの履歴書を読み取れるか、数秒でチェック。無料・登録不要、ファイルは保存されません。",
  "badge": "無料・登録不要",
  "title": "あなたの履歴書はATSを通過できますか？",
  "subtitle": "多くの応募は、まず採用管理システム（ATS）で選考されます。ATSが読み取れなければ、採用担当者の目に届きません。今すぐチェックしましょう。",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "数秒で結果表示",
    "ファイルは保存されません"
  ],
  "uploadCta": "履歴書をアップロード（PDF）",
  "uploadHint": "5MBまでのPDF",
  "pasteToggle": "テキストを貼り付ける",
  "pastePlaceholder": "履歴書のテキストをここに貼り付けてください…",
  "pasteCta": "テキストをチェック",
  "checking": "ATSと同じ方法で履歴書を読み取っています…",
  "privacy": "ファイルはスコア算出のためだけに読み取り、履歴書は保存しません。アカウントは不要です。",
  "scoreLabel": "ATS読み取りやすさ",
  "levels": {
    "good": {
      "title": "読み取りやすい履歴書です",
      "text": "システムは情報を正しく抽出できます。次は内容が決め手です。"
    },
    "attention": {
      "title": "選考で減点されています",
      "text": "一部の情報が不完全に取り込まれ、順位が下がります。"
    },
    "risk": {
      "title": "自動不合格のリスクが高い状態です",
      "text": "システムが履歴書を読み取りにくい状態です。多くの応募が誰にも見られずここで止まります。"
    }
  },
  "issuesTitle": "チェック結果",
  "noIssues": "読み取りの問題は見つかりませんでした。",
  "severity": {
    "critical": "重大",
    "warning": "注意",
    "tip": "ヒント"
  },
  "issues": {
    "no_text": {
      "title": "読み取れるテキストがありません",
      "why": "画像やスキャンのため、ATSには何も見えず、空の応募として届きます。"
    },
    "too_short": {
      "title": "履歴書が短すぎます",
      "why": "テキストが少ないと、求人と照合するキーワードも少なくなります。"
    },
    "too_long": {
      "title": "履歴書が長すぎます",
      "why": "情報が多すぎるとキーワードが埋もれ、採用担当者も読み疲れます。"
    },
    "no_email": {
      "title": "メールアドレスが見つかりません",
      "why": "読み取れるメールがないと、連絡先が登録されません。"
    },
    "no_phone": {
      "title": "電話番号が見つかりません",
      "why": "面接前に電話で連絡する採用担当者は多くいます。"
    },
    "no_experience_section": {
      "title": "職歴の見出しが見つかりません",
      "why": "ATSは「職歴」などの見出しを探します。ないと職歴が読み取られないことがあります。"
    },
    "no_education_section": {
      "title": "学歴の見出しが見つかりません",
      "why": "学歴要件のある求人では、見出しが明確でない履歴書が除外されます。"
    },
    "no_skills_section": {
      "title": "スキルの見出しが見つかりません",
      "why": "システムが求人のキーワードを最も探す場所です。"
    },
    "no_dates": {
      "title": "日付が見つかりません",
      "why": "日付がないと、経験年数を計算できません。"
    },
    "garbled_chars": {
      "title": "読み取れない記号があります",
      "why": "アイコンや装飾フォントが文字化けし、情報が崩れます。"
    },
    "columns_suspected": {
      "title": "段組みや表のレイアウト",
      "why": "段組みは順番通りに読まれず、役職・日付・会社名が混ざりがちです。"
    },
    "no_metrics": {
      "title": "数値で示した成果がありません",
      "why": "数値（％、金額、件数）があると、業務の羅列と差がつきます。"
    },
    "no_linkedin": {
      "title": "LinkedInのリンクがありません",
      "why": "採用担当者は連絡前にプロフィールを確認することがよくあります。"
    }
  },
  "nextTitle": "読み取れるのは第一歩。内容はどうでしょう？",
  "nextText": "無料アカウントを作成すると、インパクト・分かりやすさ・キーワード・希望職種との適合度など、履歴書の8つのスコアを確認できます。",
  "nextCta": "8つのスコアを無料で見る",
  "shareCta": "共有",
  "shareText": "私の履歴書はATSチェックで{score}/100でした（Workday、Greenhouseなど）。あなたも無料で試せます：",
  "copied": "リンクをコピーしました！",
  "limitTitle": "無料チェックはすでに利用済みです",
  "limitText": "無料チェックはお一人様1回までです。無料アカウントを作成すると、履歴書の8つのスコアを確認できます。",
  "errorGeneric": "現在チェックを実行できません。しばらくしてからもう一度お試しください。",
  "errorTooLarge": "ファイルが5MBを超えています。重い画像を除いてPDFを書き出し直してください。",
  "errorNotPdf": "有効なPDFではありません。PDFをアップロードするか、テキストを貼り付けてください。",
  "errorRate": "短時間にチェックが多すぎます。数分お待ちください。",
  "bannerTitle": "あなたの履歴書はATSを通過できますか？",
  "bannerText": "無料・登録不要、数秒でチェック。",
  "bannerCta": "今すぐチェック",
  "faq": [
    {
      "q": "ATSとは？",
      "a": "Workday、Greenhouse、Leverなどの採用管理システムです。応募を受け付け、履歴書から情報を抽出し、採用担当者が見る前に候補者を順位付けします。"
    },
    {
      "q": "本当に無料ですか？",
      "a": "はい。アカウントもカードも不要です。ファイルはスコア算出のためだけに読み取られ、保存されません。"
    },
    {
      "q": "高スコアなら面接が保証されますか？",
      "a": "いいえ。システムが履歴書を読み取れることを示すだけです。上位に入るかは内容次第で、それを評価するのが完全分析です。"
    }
  ]
}

const ko: AtsCheckCopy = {
  "metaTitle": "무료 ATS 이력서 검사 (가입 불필요) | GriffoWork",
  "metaDescription": "Workday, Greenhouse, Lever, Taleo 등 ATS가 내 이력서를 읽을 수 있는지 몇 초 만에 확인하세요. 무료, 가입 불필요, 파일은 저장되지 않습니다.",
  "badge": "무료 · 가입 불필요",
  "title": "내 이력서, ATS를 통과할 수 있을까요?",
  "subtitle": "대부분의 지원서는 먼저 채용 관리 시스템(ATS)을 거칩니다. ATS가 읽지 못하면 채용 담당자도 볼 수 없습니다. 지금 확인하세요.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "몇 초 만에 결과 확인",
    "파일은 저장되지 않음"
  ],
  "uploadCta": "이력서 업로드 (PDF)",
  "uploadHint": "최대 5MB PDF",
  "pasteToggle": "텍스트로 붙여넣기",
  "pastePlaceholder": "이력서 텍스트를 여기에 붙여넣으세요…",
  "pasteCta": "텍스트 검사",
  "checking": "ATS가 읽는 방식으로 이력서를 읽고 있습니다…",
  "privacy": "점수 계산을 위해서만 파일을 읽으며 이력서는 저장하지 않습니다. 계정이 필요 없습니다.",
  "scoreLabel": "ATS 가독성",
  "levels": {
    "good": {
      "title": "이력서가 잘 읽힙니다",
      "text": "시스템이 정보를 추출할 수 있습니다. 이제 내용이 결정합니다."
    },
    "attention": {
      "title": "이력서가 선별 과정에서 감점되고 있습니다",
      "text": "일부 정보가 불완전하게 전달되어 순위가 낮아집니다."
    },
    "risk": {
      "title": "자동 탈락 위험이 높습니다",
      "text": "시스템이 이력서를 읽기 어려워합니다. 많은 지원서가 아무도 보지 못한 채 여기서 멈춥니다."
    }
  },
  "issuesTitle": "검사 결과",
  "noIssues": "읽기 문제가 발견되지 않았습니다.",
  "severity": {
    "critical": "심각",
    "warning": "주의",
    "tip": "팁"
  },
  "issues": {
    "no_text": {
      "title": "읽을 수 있는 텍스트가 없습니다",
      "why": "이미지나 스캔본이라 ATS는 아무것도 보지 못하고, 지원서가 빈 채로 전달됩니다."
    },
    "too_short": {
      "title": "이력서가 너무 짧습니다",
      "why": "텍스트가 적으면 채용 공고와 비교할 키워드도 적습니다."
    },
    "too_long": {
      "title": "이력서가 너무 깁니다",
      "why": "분량이 많으면 키워드가 묻히고 담당자가 지칩니다."
    },
    "no_email": {
      "title": "이메일을 찾을 수 없습니다",
      "why": "읽을 수 있는 이메일이 없으면 연락처가 등록되지 않습니다."
    },
    "no_phone": {
      "title": "전화번호를 찾을 수 없습니다",
      "why": "많은 담당자가 면접 전에 전화로 연락합니다."
    },
    "no_experience_section": {
      "title": "경력 항목을 찾을 수 없습니다",
      "why": "ATS는 \"경력\" 같은 제목을 찾습니다. 없으면 경력이 읽히지 않을 수 있습니다."
    },
    "no_education_section": {
      "title": "학력 항목을 찾을 수 없습니다",
      "why": "학력 요건이 있는 공고는 항목이 명확하지 않은 이력서를 걸러냅니다."
    },
    "no_skills_section": {
      "title": "기술 항목을 찾을 수 없습니다",
      "why": "시스템이 공고 키워드를 가장 많이 찾는 곳입니다."
    },
    "no_dates": {
      "title": "날짜를 찾을 수 없습니다",
      "why": "날짜가 없으면 경력 기간을 계산할 수 없습니다."
    },
    "garbled_chars": {
      "title": "읽을 수 없는 기호가 있습니다",
      "why": "아이콘과 장식용 글꼴이 깨진 문자로 바뀌어 정보가 뒤섞입니다."
    },
    "columns_suspected": {
      "title": "단 나누기 또는 표 레이아웃",
      "why": "단은 순서가 뒤바뀌어 읽히기 쉬워 직무, 날짜, 회사가 섞입니다."
    },
    "no_metrics": {
      "title": "수치로 된 성과가 없습니다",
      "why": "수치(%, 금액, 건수)는 단순한 업무 나열과 차별화해 줍니다."
    },
    "no_linkedin": {
      "title": "LinkedIn 링크가 없습니다",
      "why": "담당자는 연락하기 전에 프로필을 확인하는 경우가 많습니다."
    }
  },
  "nextTitle": "읽히는 것은 첫걸음입니다. 내용은요?",
  "nextText": "무료 계정을 만들고 임팩트, 명확성, 키워드, 희망 직무 적합도 등 이력서의 8가지 점수를 확인하세요.",
  "nextCta": "8가지 점수 무료로 보기",
  "shareCta": "공유",
  "shareText": "내 이력서가 ATS 검사에서 {score}/100점을 받았어요 (Workday, Greenhouse 등). 무료로 확인해 보세요:",
  "copied": "링크가 복사되었습니다!",
  "limitTitle": "무료 검사를 이미 사용하셨습니다",
  "limitText": "무료 검사는 1인 1회입니다. 무료 계정을 만들고 이력서의 8가지 점수를 확인하세요.",
  "errorGeneric": "지금은 검사할 수 없습니다. 잠시 후 다시 시도해 주세요.",
  "errorTooLarge": "파일이 5MB를 초과합니다. 무거운 이미지를 빼고 PDF를 다시 내보내 주세요.",
  "errorNotPdf": "유효한 PDF가 아닙니다. PDF를 업로드하거나 텍스트를 붙여넣으세요.",
  "errorRate": "검사를 너무 많이 했습니다. 몇 분 후에 다시 시도하세요.",
  "bannerTitle": "내 이력서, ATS를 통과할 수 있을까요?",
  "bannerText": "무료, 가입 불필요, 몇 초면 끝.",
  "bannerCta": "지금 검사하기",
  "faq": [
    {
      "q": "ATS란 무엇인가요?",
      "a": "Workday, Greenhouse, Lever 같은 채용 관리 시스템입니다. 지원서를 받아 이력서 정보를 추출하고, 담당자가 보기 전에 지원자 순위를 매깁니다."
    },
    {
      "q": "정말 무료인가요?",
      "a": "네. 계정도 카드도 필요 없습니다. 파일은 점수 계산에만 사용되고 저장되지 않습니다."
    },
    {
      "q": "점수가 높으면 면접이 보장되나요?",
      "a": "아니요. 시스템이 이력서를 읽을 수 있다는 뜻입니다. 상위로 올려주는 것은 내용이며, 그것을 평가하는 것이 전체 분석입니다."
    }
  ]
}

const zh: AtsCheckCopy = {
  "metaTitle": "免费 ATS 简历检测（无需注册） | GriffoWork",
  "metaDescription": "几秒内了解 Workday、Greenhouse、Lever、Taleo 等 ATS 能否读取你的简历。免费、无需账号，文件不会被保存。",
  "badge": "免费 · 无需注册",
  "title": "你的简历能通过 ATS 筛选吗？",
  "subtitle": "大多数求职申请会先经过招聘管理系统（ATS）筛选。如果它读不懂你的简历，招聘人员就看不到。立即检测。",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "几秒出结果",
    "文件不会被保存"
  ],
  "uploadCta": "上传简历（PDF）",
  "uploadHint": "PDF 不超过 5 MB",
  "pasteToggle": "改为粘贴文本",
  "pastePlaceholder": "在此粘贴你的简历文本…",
  "pasteCta": "检测文本",
  "checking": "正在像 ATS 一样读取你的简历…",
  "privacy": "文件仅用于计算分数，我们不会保存你的简历。无需账号。",
  "scoreLabel": "ATS 可读性",
  "levels": {
    "good": {
      "title": "你的简历易于读取",
      "text": "系统能提取你的信息，接下来取决于内容。"
    },
    "attention": {
      "title": "你的简历在筛选中被扣分",
      "text": "部分信息读取不完整，会拉低你的排名。"
    },
    "risk": {
      "title": "被自动淘汰的风险很高",
      "text": "系统难以读取你的简历，许多申请在这里就被无声淘汰。"
    }
  },
  "issuesTitle": "检测结果",
  "noIssues": "未发现读取问题。",
  "severity": {
    "critical": "严重",
    "warning": "注意",
    "tip": "建议"
  },
  "issues": {
    "no_text": {
      "title": "文件中没有可读文本",
      "why": "这是图片或扫描件，ATS 什么也看不到，你的申请等于空白。"
    },
    "too_short": {
      "title": "简历太短",
      "why": "文本太少，可与职位匹配的关键词也少。"
    },
    "too_long": {
      "title": "简历太长",
      "why": "内容过多会稀释关键词，也让招聘人员疲于阅读。"
    },
    "no_email": {
      "title": "未找到电子邮箱",
      "why": "没有可读的邮箱，系统无法登记你的联系方式。"
    },
    "no_phone": {
      "title": "未找到电话号码",
      "why": "很多招聘人员会在面试前先打电话。"
    },
    "no_experience_section": {
      "title": "未识别到工作经历部分",
      "why": "ATS 会寻找“工作经历”之类的标题，缺少时你的经历可能无法被读取。"
    },
    "no_education_section": {
      "title": "未识别到教育背景部分",
      "why": "有学历要求的职位会过滤掉没有清晰教育部分的简历。"
    },
    "no_skills_section": {
      "title": "未识别到技能部分",
      "why": "这是系统最常搜索职位关键词的地方。"
    },
    "no_dates": {
      "title": "未找到日期",
      "why": "没有日期，系统无法计算你的工作年限。"
    },
    "garbled_chars": {
      "title": "文本中有无法识别的符号",
      "why": "图标和装饰字体会变成乱码，打乱你的信息。"
    },
    "columns_suspected": {
      "title": "分栏或表格排版",
      "why": "分栏常被乱序读取，职位、日期和公司混在一起。"
    },
    "no_metrics": {
      "title": "没有量化成果",
      "why": "数字（百分比、金额、数量）能让你区别于单纯的任务罗列。"
    },
    "no_linkedin": {
      "title": "没有 LinkedIn 链接",
      "why": "招聘人员常在联系前查看你的主页。"
    }
  },
  "nextTitle": "能被读取只是第一步，内容呢？",
  "nextText": "免费注册，查看简历的 8 项评分：影响力、清晰度、关键词以及与目标职位的匹配度。",
  "nextCta": "免费查看我的 8 项评分",
  "shareCta": "分享",
  "shareText": "我的简历在 ATS 检测中得了 {score}/100（Workday、Greenhouse 等）。你也来免费测一测：",
  "copied": "链接已复制！",
  "limitTitle": "你已使用过免费检测",
  "limitText": "免费检测每人限一次。免费注册即可查看简历的 8 项评分。",
  "errorGeneric": "暂时无法检测，请稍后再试。",
  "errorTooLarge": "文件超过 5 MB，请去掉大图后重新导出 PDF。",
  "errorNotPdf": "这不是有效的 PDF。请上传 PDF 或粘贴文本。",
  "errorRate": "检测次数过多，请等待几分钟。",
  "bannerTitle": "你的简历能通过 ATS 筛选吗？",
  "bannerText": "免费检测，无需注册，几秒完成。",
  "bannerCta": "立即检测",
  "faq": [
    {
      "q": "什么是 ATS？",
      "a": "即招聘管理系统，如 Workday、Greenhouse 或 Lever。它接收申请、提取简历信息，并在招聘人员查看前为候选人排序。"
    },
    {
      "q": "真的免费吗？",
      "a": "是的。无需账号，无需银行卡。文件仅用于计算分数，不会保存。"
    },
    {
      "q": "高分能保证获得面试吗？",
      "a": "不能。它只说明系统可以读取你的简历。让你排在前面的是内容，这正是完整分析所评估的。"
    }
  ]
}

const ar: AtsCheckCopy = {
  "metaTitle": "فحص السيرة الذاتية لأنظمة ATS مجانًا ودون تسجيل | GriffoWork",
  "metaDescription": "اعرف خلال ثوانٍ إن كانت أنظمة مثل Workday وGreenhouse وLever وTaleo قادرة على قراءة سيرتك الذاتية. مجاني، دون حساب، ولا يتم حفظ الملف.",
  "badge": "مجاني · دون تسجيل",
  "title": "هل تجتاز سيرتك الذاتية فلتر ATS؟",
  "subtitle": "تمر معظم الطلبات أولًا عبر نظام فرز آلي (ATS). إذا لم يستطع قراءة سيرتك الذاتية فلن يراها أي مسؤول توظيف. جرّب الآن.",
  "bullets": [
    GLOBAL_ATS_NAMES,
    "النتيجة خلال ثوانٍ",
    "لا يتم حفظ الملف"
  ],
  "uploadCta": "ارفع السيرة الذاتية (PDF)",
  "uploadHint": "ملف PDF حتى 5 ميغابايت",
  "pasteToggle": "أفضّل لصق النص",
  "pastePlaceholder": "الصق نص سيرتك الذاتية هنا…",
  "pasteCta": "افحص النص",
  "checking": "نقرأ سيرتك الذاتية كما يقرأها نظام ATS…",
  "privacy": "نقرأ الملف فقط لحساب النتيجة ولا نحفظ سيرتك الذاتية. لا تحتاج إلى حساب.",
  "scoreLabel": "قابلية القراءة لأنظمة ATS",
  "levels": {
    "good": {
      "title": "سيرتك الذاتية مقروءة جيدًا",
      "text": "يستطيع النظام استخراج معلوماتك. الآن المحتوى هو ما يحسم الأمر."
    },
    "attention": {
      "title": "سيرتك الذاتية تخسر نقاطًا في الفرز",
      "text": "بعض المعلومات تصل ناقصة، ما يخفض ترتيبك."
    },
    "risk": {
      "title": "خطر مرتفع للاستبعاد التلقائي",
      "text": "يواجه النظام صعوبة في قراءة سيرتك الذاتية، وتتوقف طلبات كثيرة هنا دون أن يراها أحد."
    }
  },
  "issuesTitle": "ما وجدناه",
  "noIssues": "لم نجد مشكلات في القراءة.",
  "severity": {
    "critical": "حرج",
    "warning": "تنبيه",
    "tip": "نصيحة"
  },
  "issues": {
    "no_text": {
      "title": "لا يحتوي الملف على نص مقروء",
      "why": "الملف صورة أو مسح ضوئي، فلا يرى النظام شيئًا ويصل طلبك فارغًا."
    },
    "too_short": {
      "title": "السيرة الذاتية قصيرة جدًا",
      "why": "النص القليل يعني كلمات مفتاحية قليلة للمطابقة مع الوظيفة."
    },
    "too_long": {
      "title": "السيرة الذاتية طويلة جدًا",
      "why": "الإطالة تُضعف الكلمات المفتاحية وتُتعب مسؤول التوظيف."
    },
    "no_email": {
      "title": "لم نجد بريدًا إلكترونيًا",
      "why": "دون بريد مقروء لا يستطيع النظام تسجيل بيانات التواصل."
    },
    "no_phone": {
      "title": "لم نجد رقم هاتف",
      "why": "يتصل كثير من مسؤولي التوظيف قبل تحديد المقابلة."
    },
    "no_experience_section": {
      "title": "لم نتعرف على قسم الخبرة",
      "why": "يبحث النظام عن عنوان مثل «الخبرة العملية»، وبدونه قد لا تُقرأ وظائفك."
    },
    "no_education_section": {
      "title": "لم نتعرف على قسم التعليم",
      "why": "الوظائف التي تشترط مؤهلًا تستبعد السير الذاتية دون قسم واضح."
    },
    "no_skills_section": {
      "title": "لم نتعرف على قسم المهارات",
      "why": "هنا يبحث النظام أكثر عن الكلمات المفتاحية للوظيفة."
    },
    "no_dates": {
      "title": "لم نجد تواريخ",
      "why": "دون تواريخ لا يستطيع النظام حساب سنوات خبرتك."
    },
    "garbled_chars": {
      "title": "رموز غير مقروءة في النص",
      "why": "الأيقونات والخطوط الزخرفية تتحول إلى رموز غريبة وتخلط معلوماتك."
    },
    "columns_suspected": {
      "title": "تصميم بأعمدة أو جداول",
      "why": "غالبًا تُقرأ الأعمدة بترتيب خاطئ فتختلط المسميات والتواريخ والجهات."
    },
    "no_metrics": {
      "title": "لا توجد نتائج بالأرقام",
      "why": "الأرقام (نِسب، مبالغ، كميات) تميّزك عن مجرد قائمة مهام."
    },
    "no_linkedin": {
      "title": "لا يوجد رابط LinkedIn",
      "why": "كثيرًا ما يراجع مسؤولو التوظيف الملف الشخصي قبل التواصل."
    }
  },
  "nextTitle": "المقروئية هي الخطوة الأولى. ماذا عن المحتوى؟",
  "nextText": "أنشئ حسابًا مجانيًا واطّلع على 8 تقييمات لسيرتك الذاتية: الأثر والوضوح والكلمات المفتاحية والتوافق مع الوظيفة المطلوبة.",
  "nextCta": "اعرض تقييماتي الثمانية مجانًا",
  "shareCta": "مشاركة",
  "shareText": "حصلت سيرتي الذاتية على {score}/100 في فحص ATS (Workday وGreenhouse…). جرّب سيرتك مجانًا:",
  "copied": "تم نسخ الرابط!",
  "limitTitle": "لقد استخدمت فحصك المجاني بالفعل",
  "limitText": "الفحص المجاني مرة واحدة لكل شخص. أنشئ حسابًا مجانيًا لتطّلع على 8 تقييمات لسيرتك الذاتية.",
  "errorGeneric": "تعذّر إجراء الفحص الآن. حاول مرة أخرى بعد قليل.",
  "errorTooLarge": "حجم الملف يتجاوز 5 ميغابايت. صدّر ملف PDF مجددًا دون صور كبيرة.",
  "errorNotPdf": "هذا ليس ملف PDF صالحًا. ارفع ملف PDF أو الصق النص.",
  "errorRate": "عدد كبير من الفحوص المتتالية. انتظر بضع دقائق.",
  "bannerTitle": "هل تجتاز سيرتك الذاتية فلتر ATS؟",
  "bannerText": "فحص مجاني دون تسجيل خلال ثوانٍ.",
  "bannerCta": "افحص الآن",
  "faq": [
    {
      "q": "ما هو نظام ATS؟",
      "a": "نظام لإدارة طلبات التوظيف مثل Workday وGreenhouse وLever. يستقبل الطلبات ويستخرج بيانات السيرة الذاتية ويرتّب المرشحين قبل أن يطّلع عليهم مسؤول التوظيف."
    },
    {
      "q": "هل الفحص مجاني فعلًا؟",
      "a": "نعم. دون حساب أو بطاقة. يُقرأ الملف لحساب النتيجة فقط ولا يُحفظ."
    },
    {
      "q": "هل تضمن النتيجة المرتفعة مقابلة؟",
      "a": "لا. هي تبيّن أن النظام يستطيع قراءة سيرتك الذاتية. المحتوى هو ما يضعك في المقدمة، وهذا ما يقيّمه التحليل الكامل."
    }
  ]
}

export const ATS_CHECK_COPY: Record<AtsCheckLang, AtsCheckCopy> = { pt, en, es, de, fr, it, nl, sv, ja, ko, zh, ar }
