import {
  PDFDocument, StandardFonts, rgb, PDFFont,
} from 'pdf-lib'
import { DICTIONARIES, type Language, localeForLang } from './i18n'

// Color helpers
const hex = (h: string) => {
  const r = parseInt(h.slice(1, 3), 16) / 255
  const g = parseInt(h.slice(3, 5), 16) / 255
  const b = parseInt(h.slice(5, 7), 16) / 255
  return rgb(r, g, b)
}

// Sanitize text - replace unicode chars that Helvetica (WinAnsi) cannot encode
function sanitizeText(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/✓/g, '[OK]')
    .replace(/✗/g, '[X]')
    .replace(/→/g, '->')
    .replace(/•/g, '-')
    .replace(/●/g, '-')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?') // keep ASCII + Latin-1 only
}

const COLORS = {
  text: hex('#0f172a'),
  body: hex('#1e293b'),
  muted: hex('#64748b'),
  light: hex('#94a3b8'),
  emerald: hex('#16a34a'),
  amber: hex('#d97706'),
  red: hex('#dc2626'),
  sky: hex('#0ea5e9'),
  violet: hex('#7c3aed'),
  bgSoft: hex('#f1f5f9'),
  border: hex('#e2e8f0'),
}

// Strip markdown bold/italic markers from a line for PDF rendering
function stripMd(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
}

export async function generateResumePdf(markdownContent: string): Promise<Buffer> {
  const doc = await PDFDocument.create()
  doc.setTitle('Currículo')
  // `Creator` é a FERRAMENTA que gerou o arquivo; `Author` é quem responde
  // pelo conteúdo. Antes o GriffoWork se declarava autor, e isso é errado nos
  // dois sentidos: o currículo é da pessoa, e um documento montado a partir de
  // texto que ela enviou sairia com a nossa assinatura no que ela escreveu.
  // O campo de autor fica vazio de propósito — melhor sem autor declarado que
  // com o autor errado.
  doc.setCreator('GriffoWork')
  doc.setProducer('GriffoWork')
  doc.setSubject('Currículo Otimizado')
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique)

  const W = 595.28 // A4 width in pt
  const H = 841.89
  const MARGIN = 56
  const contentW = W - MARGIN * 2

  let page = doc.addPage([W, H])
  let y = H - MARGIN

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([W, H])
      y = H - MARGIN
    }
  }

  const writeParagraph = (text: string, opts: {
    font?: PDFFont
    size?: number
    color?: ReturnType<typeof rgb>
    indent?: number
    align?: 'left' | 'center'
    lineHeight?: number
    maxWidth?: number
  } = {}) => {
    const f = opts.font || font
    const size = opts.size || 10
    const color = opts.color || COLORS.body
    const indent = opts.indent || 0
    const lh = opts.lineHeight || size * 1.35
    const maxWidth = opts.maxWidth || contentW - indent

    const safeText = sanitizeText(text)
    const words = safeText.split(/\s+/).filter(Boolean)
    const lines: string[] = []
    let current = ''
    for (const w of words) {
      const test = current ? `${current} ${w}` : w
      const width = f.widthOfTextAtSize(test, size)
      if (width > maxWidth) {
        if (current) lines.push(current)
        if (f.widthOfTextAtSize(w, size) > maxWidth) {
          let chunk = ''
          for (const ch of w) {
            if (f.widthOfTextAtSize(chunk + ch, size) > maxWidth) {
              if (chunk) lines.push(chunk)
              chunk = ch
            } else {
              chunk += ch
            }
          }
          current = chunk
        } else {
          current = w
        }
      } else {
        current = test
      }
    }
    if (current) lines.push(current)

    for (const line of lines) {
      ensureSpace(lh)
      const x = opts.align === 'center' ? (W - f.widthOfTextAtSize(line, size)) / 2 : MARGIN + indent
      page.drawText(line, { x, y: y - size, size, font: f, color })
      y -= lh
    }
  }

  const drawHr = (color = COLORS.border, width = 0.5) => {
    ensureSpace(8)
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: W - MARGIN, y },
      thickness: width,
      color,
    })
    y -= 6
  }

  const lines = markdownContent.replace(/\r\n/g, '\n').split('\n')
  for (const rawLine of lines) {
    const line = stripMd(rawLine).trim()

    if (!line) {
      y -= 6
      continue
    }

    if (line.startsWith('# ') && !line.startsWith('## ')) {
      y -= 4
      writeParagraph(line.replace(/^#\s+/, ''), { font: fontBold, size: 22, color: COLORS.text, align: 'center', lineHeight: 26 })
      y -= 4
    } else if (line.startsWith('## ')) {
      y -= 8
      writeParagraph(line.replace(/^##\s+/, '').toUpperCase(), { font: fontBold, size: 13, color: COLORS.text, lineHeight: 16 })
      drawHr(COLORS.text, 1)
      y -= 2
    } else if (line.startsWith('### ')) {
      y -= 4
      writeParagraph(line.replace(/^###\s+/, ''), { font: fontBold, size: 11, color: COLORS.text, lineHeight: 14 })
      drawHr(COLORS.border, 0.5)
    } else if (line.startsWith('---') || line.startsWith('***')) {
      drawHr(COLORS.border, 0.5)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      writeParagraph('•  ' + line.replace(/^[-*]\s+/, ''), { font, size: 10, color: COLORS.body, indent: 12, lineHeight: 13 })
    } else if (/^\d+\.\s+/.test(line)) {
      writeParagraph(line, { font, size: 10, color: COLORS.body, indent: 12, lineHeight: 13 })
    } else if (/@|linkedin\.com|github\.com|\|\s|http/.test(line) && line.length < 140) {
      writeParagraph(line, { font, size: 9, color: COLORS.muted, align: 'center', lineHeight: 12 })
    } else {
      writeParagraph(line, { font, size: 10, color: COLORS.body, lineHeight: 13 })
    }
  }

  const bytes = await doc.save()
  return Buffer.from(bytes)
}

export async function generateAnalysisReportPdf(opts: {
  userName?: string
  resumeId: string
  analysis: any
  createdAt: Date
  lang?: Language
}): Promise<Buffer> {
  const lang: Language = opts.lang || 'pt'
  const dict = DICTIONARIES[lang]?.pdfReport || DICTIONARIES.pt.pdfReport
  const locale = localeForLang(lang)

  const doc = await PDFDocument.create()
  doc.setTitle(dict.docTitle)
  doc.setAuthor(dict.docAuthor)
  doc.setSubject(dict.docSubject)
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique)

  const W = 595.28
  const H = 841.89
  const MARGIN = 40
  const contentW = W - MARGIN * 2

  let page = doc.addPage([W, H])
  let y = H - MARGIN

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([W, H])
      y = H - MARGIN
    }
  }

  const writeParagraph = (
    text: string,
    opts: {
      font?: typeof font
      size?: number
      color?: ReturnType<typeof rgb>
      align?: 'left' | 'center'
      lineHeight?: number
      indent?: number
      maxWidth?: number
    } = {}
  ) => {
    const f = opts.font || font
    const size = opts.size || 10
    const color = opts.color || COLORS.body
    const lh = opts.lineHeight || size * 1.3
    const maxW = opts.maxWidth || contentW
    const indent = opts.indent || 0

    const clean = sanitizeText(text)
    if (!clean) return

    const words = clean.split(/\s+/)
    const lines: string[] = []
    let current = ''

    for (const w of words) {
      const test = current ? `${current} ${w}` : w
      const width = f.widthOfTextAtSize(test, size)
      if (width <= maxW - indent) {
        current = test
      } else {
        if (current) lines.push(current)
        current = w
      }
    }
    if (current) lines.push(current)

    for (const line of lines) {
      ensureSpace(lh)
      const x = opts.align === 'center' ? (W - f.widthOfTextAtSize(line, size)) / 2 : MARGIN + indent
      page.drawText(line, { x, y: y - size, size, font: f, color })
      y -= lh
    }
  }

  const a = opts.analysis
  const score = Number(a.overall || 0)
  const scoreColor = score >= 8 ? COLORS.emerald : score >= 5 ? COLORS.amber : COLORS.red

  // HEADER
  writeParagraph(dict.docTitle, { font: fontBold, size: 20, color: COLORS.text, lineHeight: 24 })
  y -= 4
  const dateStr = dict.generatedAt.replace('{date}', opts.createdAt.toLocaleString(locale)) + `  •  ID: ${opts.resumeId}`
  writeParagraph(dateStr, { font, size: 9, color: COLORS.muted, lineHeight: 11 })
  y -= 6
  page.drawLine({ start: { x: MARGIN, y }, end: { x: W - MARGIN, y }, thickness: 1.2, color: COLORS.text })
  y -= 16

  // OVERALL SCORE
  writeParagraph(dict.overallScore, { font: fontBold, size: 11, color: COLORS.text, lineHeight: 14 })
  y -= 4
  const scoreStr = `${score.toFixed(1)} / 10`
  page.drawText(scoreStr, { x: MARGIN, y: y - 48, size: 48, font: fontBold, color: scoreColor })
  y -= 60
  writeParagraph(a.summary || '', { font, size: 10, color: COLORS.body, lineHeight: 13 })
  y -= 8

  // ATS
  writeParagraph(dict.atsTitle, { font: fontBold, size: 11, color: COLORS.text, lineHeight: 14 })
  y -= 2
  if (a.atsFriendly) {
    writeParagraph(`[OK] ${dict.atsPass}`, { font, size: 10, color: COLORS.emerald, lineHeight: 13 })
  } else {
    writeParagraph(`[X] ${dict.atsFail}`, { font, size: 10, color: COLORS.red, lineHeight: 13 })
  }
  y -= 8

  // DIMENSIONS
  writeParagraph(dict.dimensionsTitle, { font: fontBold, size: 11, color: COLORS.text, lineHeight: 14 })
  y -= 4
  for (const d of a.dimensions || []) {
    const dScore = Number(d.score || 0)
    const dColor = dScore >= 8 ? COLORS.emerald : dScore >= 5 ? COLORS.amber : COLORS.red
    ensureSpace(50)
    page.drawText(sanitizeText(`${d.label || d.key}:`), { x: MARGIN, y: y - 10, size: 10, font: fontBold, color: COLORS.text })
    const scoreText = `${dScore.toFixed(1)} / 10`
    const scoreW = fontBold.widthOfTextAtSize(scoreText, 10)
    page.drawText(scoreText, { x: W - MARGIN - scoreW, y: y - 10, size: 10, font: fontBold, color: dColor })
    y -= 14
    writeParagraph(d.rationale || '', { font, size: 9, color: COLORS.muted, lineHeight: 11, indent: 0 })
    y -= 2
    ensureSpace(8)
    page.drawRectangle({ x: MARGIN, y: y - 4, width: contentW, height: 4, color: COLORS.bgSoft })
    page.drawRectangle({ x: MARGIN, y: y - 4, width: contentW * (dScore / 10), height: 4, color: dColor })
    y -= 10
  }
  y -= 6

  // Helper for sections
  const writeList = (title: string, items: string[], color: ReturnType<typeof rgb>) => {
    ensureSpace(30)
    y -= 4
    writeParagraph(title, { font: fontBold, size: 11, color, lineHeight: 14 })
    y -= 2
    for (const item of items || []) {
      writeParagraph(`•  ${item}`, { font, size: 9, color: COLORS.body, indent: 12, lineHeight: 12, maxWidth: contentW - 12 })
      y -= 1
    }
    y -= 4
  }

  writeList(dict.strengthsTitle, a.strengths || [], COLORS.emerald)
  writeList(dict.weaknessesTitle, a.weaknesses || [], COLORS.red)
  writeList(dict.recommendationsTitle, a.recommendations || [], COLORS.text)
  if (a.keywords?.length) {
    writeList(dict.keywordsTitle, [a.keywords.join(', ')], COLORS.sky)
  }

  // Footer
  y -= 8
  ensureSpace(20)
  writeParagraph(dict.footerNote, { font: fontItalic, size: 8, color: COLORS.light, lineHeight: 10 })

  const bytes = await doc.save()
  return Buffer.from(bytes)
}

export function sanitizeMarkdown(md: string): string {
  return md.replace(/\r\n/g, '\n').trim() + '\n'
}
