import PDFDocument from 'pdfkit'
import type { CallCampaignReport, CallContact } from './call-campaign.types.ts'

const PAGE_MARGIN = 50
const CONTENT_WIDTH = 495.28

const COLUMN_WIDTHS = {
  index: 22,
  name: 245,
  instagram: 133,
  phone: 95,
} as const

const COLUMN_X = {
  index: PAGE_MARGIN,
  name: PAGE_MARGIN + COLUMN_WIDTHS.index,
  instagram: PAGE_MARGIN + COLUMN_WIDTHS.index + COLUMN_WIDTHS.name,
  phone: PAGE_MARGIN + COLUMN_WIDTHS.index + COLUMN_WIDTHS.name + COLUMN_WIDTHS.instagram,
} as const

const GRAY = '#94A3B8'
const HEADER_FILL = '#F1F5F9'
const ZEBRA_FILL = '#FAFAFA'
const MISSING_ROW_FILL = '#FEF2F2'
const DARK_TEXT = '#0F172A'

const EM_DASH = '—'

const CELL_PADDING_X = 4
const CELL_PADDING_Y = 4
const HEADER_ROW_HEIGHT = 22
const MIN_ROW_HEIGHT = 18

// Renders a "coordinator call campaign" report to a PDF, returning the finished
// buffer. This is a PURE function of the report model — no I/O, no side effects
// besides pdfkit's internal stream — which is what keeps the service testable
// without touching pdfkit directly.
export function renderCallCampaignPdf(report: CallCampaignReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    renderCoverPage(doc, report)

    for (const group of report.groups) {
      doc.addPage()
      renderGroupPage(doc, report, group)
    }

    addPageFooters(doc)

    doc.end()
  })
}

function renderCoverPage(doc: PDFKit.PDFDocument, report: CallCampaignReport) {
  const pageWidth = doc.page.width - PAGE_MARGIN * 2

  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK_TEXT).text('CAMPANHA DE LIGAÇÕES')
  doc.moveDown(0.3)
  doc.font('Helvetica-Bold').fontSize(22).text(report.event.name)
  doc.moveDown(0.5)

  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + pageWidth, doc.y)
    .strokeColor(GRAY)
    .stroke()
  doc.moveDown(0.8)

  const perCoordinator = describePerCoordinatorRange(report)

  doc.font('Helvetica').fontSize(10).fillColor(DARK_TEXT)
  doc.text(`Gerado em .............. ${formatDateTime(report.generatedAt)}`)
  doc.text(`Coordenadores ........... ${report.groups.length}`)
  doc.text(`Contatos a ligar ........ ${report.totalContacts}`)
  doc.text(`Por coordenador ......... ${perCoordinator}`)
  doc.moveDown(1)

  const calloutText =
    'Cada coordenador liga para a SUA lista. Os contatos não são da sua equipe — a divisão é ' +
    'por igualdade de carga, não por equipe. Confirme os dados e avise que a pessoa está no evento.'

  const calloutX = PAGE_MARGIN
  const calloutWidth = pageWidth
  const calloutPadding = 12
  const calloutTop = doc.y
  const textHeight = doc
    .font('Helvetica')
    .fontSize(10)
    .heightOfString(calloutText, {
      width: calloutWidth - calloutPadding * 2,
    })
  const calloutHeight = textHeight + calloutPadding * 2

  doc
    .rect(calloutX, calloutTop, calloutWidth, calloutHeight)
    .strokeColor(GRAY)
    .lineWidth(1)
    .stroke()

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(DARK_TEXT)
    .text(calloutText, calloutX + calloutPadding, calloutTop + calloutPadding, {
      width: calloutWidth - calloutPadding * 2,
    })

  doc.y = calloutTop + calloutHeight
}

function describePerCoordinatorRange(report: CallCampaignReport): string {
  const sizes = report.groups.map((group) => group.contacts.length)
  if (sizes.length === 0) return '0'

  const min = Math.min(...sizes)
  const max = Math.max(...sizes)

  return min === max ? `${min}` : `${min} ou ${max}`
}

function renderGroupPage(
  doc: PDFKit.PDFDocument,
  report: CallCampaignReport,
  group: CallCampaignReport['groups'][number]
) {
  renderRunningHead(doc, report)
  renderGroupHeader(doc, group)
  renderTableHeader(doc)

  if (group.contacts.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(GRAY)
      .text('Nenhum contato atribuído.', PAGE_MARGIN, doc.y + 8)
    return
  }

  let missingBothCount = 0
  const missingBothEmails: string[] = []

  group.contacts.forEach((contact, index) => {
    const missingBoth = !contact.phone && !contact.instagram
    if (missingBoth) {
      missingBothCount += 1
      missingBothEmails.push(contact.email)
    }

    renderContactRow(doc, report, group, contact, index + 1)
  })

  if (missingBothCount > 0) {
    renderWarningLine(doc, missingBothCount, missingBothEmails)
  }
}

function renderRunningHead(doc: PDFKit.PDFDocument, report: CallCampaignReport) {
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(GRAY)
    .text(`${report.event.name} · Campanha de Ligações`, PAGE_MARGIN, PAGE_MARGIN)

  const lineY = doc.y + 4
  doc
    .moveTo(PAGE_MARGIN, lineY)
    .lineTo(doc.page.width - PAGE_MARGIN, lineY)
    .strokeColor(GRAY)
    .stroke()

  doc.y = lineY + 10
}

function renderGroupHeader(
  doc: PDFKit.PDFDocument,
  group: CallCampaignReport['groups'][number],
  isContinuation = false
) {
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(DARK_TEXT)
    .text(group.coordinator.name.toUpperCase(), PAGE_MARGIN, doc.y)

  const contactCount = group.contacts.length
  const subtitle =
    `Coordenador(a) · Equipe ${group.coordinator.teamName} · ` +
    `${contactCount} ${contactCount === 1 ? 'contato' : 'contatos'}`

  doc.font('Helvetica').fontSize(10).fillColor(GRAY).text(subtitle)

  if (isContinuation) {
    doc.font('Helvetica-Oblique').fontSize(9).fillColor(GRAY).text('(continuação)')
  }

  doc.moveDown(0.6)
}

function renderTableHeader(doc: PDFKit.PDFDocument) {
  const y = doc.y

  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill(HEADER_FILL)

  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_TEXT)
  doc.text('#', COLUMN_X.index + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.index - CELL_PADDING_X,
  })
  doc.text('NOME', COLUMN_X.name + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.name - CELL_PADDING_X,
  })
  doc.text('INSTAGRAM', COLUMN_X.instagram + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.instagram - CELL_PADDING_X,
  })
  doc.text('TELEFONE', COLUMN_X.phone + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.phone - CELL_PADDING_X,
  })

  doc.y = y + HEADER_ROW_HEIGHT
}

function pageBottom(doc: PDFKit.PDFDocument): number {
  return doc.page.height - PAGE_MARGIN
}

function renderContactRow(
  doc: PDFKit.PDFDocument,
  report: CallCampaignReport,
  group: CallCampaignReport['groups'][number],
  contact: CallContact,
  rowNumber: number
) {
  doc.font('Helvetica').fontSize(9)

  const nameHeight = doc.heightOfString(contact.name, {
    width: COLUMN_WIDTHS.name - CELL_PADDING_X * 2,
  })
  const rowHeight = Math.max(MIN_ROW_HEIGHT, nameHeight + CELL_PADDING_Y * 2)

  if (doc.y + rowHeight > pageBottom(doc)) {
    doc.addPage()
    renderRunningHead(doc, report)
    renderGroupHeader(doc, group, true)
    renderTableHeader(doc)
  }

  const y = doc.y
  const missingBoth = !contact.phone && !contact.instagram

  if (missingBoth) {
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(MISSING_ROW_FILL)
  } else if (rowNumber % 2 === 0) {
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill(ZEBRA_FILL)
  }

  doc.font('Helvetica').fontSize(9).fillColor(DARK_TEXT)
  doc.text(`${rowNumber}`, COLUMN_X.index + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.index - CELL_PADDING_X,
  })
  doc.text(contact.name, COLUMN_X.name + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.name - CELL_PADDING_X * 2,
  })

  doc.fillColor(contact.instagram ? DARK_TEXT : GRAY)
  doc.text(contact.instagram ?? EM_DASH, COLUMN_X.instagram + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.instagram - CELL_PADDING_X * 2,
  })

  doc.fillColor(contact.phone ? DARK_TEXT : GRAY)
  doc.text(contact.phone ?? EM_DASH, COLUMN_X.phone + CELL_PADDING_X, y + CELL_PADDING_Y, {
    width: COLUMN_WIDTHS.phone - CELL_PADDING_X,
    lineBreak: false,
  })

  doc.y = y + rowHeight
}

function renderWarningLine(doc: PDFKit.PDFDocument, count: number, emails: string[]) {
  const noun = count === 1 ? 'contato' : 'contatos'
  const text = `${count} ${noun} sem telefone nem Instagram (email: ${emails.join(', ')}) — avise a coordenação geral.`

  doc.moveDown(0.5)

  // The standard-14 fonts are WinAnsi-encoded, which has no warning-sign glyph
  // (U+26A0 silently renders as "&"). A bold "ATENÇÃO" carries the same emphasis
  // using characters the encoding actually covers.
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(DARK_TEXT)
    .text('ATENÇÃO · ', PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, continued: true })
    .font('Helvetica')
    .text(text)
}

function addPageFooters(doc: PDFKit.PDFDocument) {
  const pageCount = doc.bufferedPageRange().count

  // Page 0 is the cover — it carries no "Página N de M" footer, matching the mock.
  for (let index = 1; index < pageCount; index++) {
    doc.switchToPage(index)

    // The footer deliberately sits inside the bottom margin. pdfkit auto-adds a
    // page whenever text would cross the bottom margin boundary, so the margin
    // has to be dropped for the write and restored afterwards — otherwise every
    // footer spawns a blank page and the page count is wrong. Margins are
    // per-page, so this has to happen inside the loop.
    const originalBottomMargin = doc.page.margins.bottom
    doc.page.margins.bottom = 0

    const text = `Página ${index + 1} de ${pageCount}`
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(GRAY)
      .text(text, PAGE_MARGIN, doc.page.height - PAGE_MARGIN + 10, {
        width: CONTENT_WIDTH,
        align: 'right',
        lineBreak: false,
      })

    doc.page.margins.bottom = originalBottomMargin
  }
}

function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} às ${hours}:${minutes}`
}
