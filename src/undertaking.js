import { jsPDF } from 'jspdf'

export const letterhead = import.meta.env.BASE_URL + 'letterhead.png'
export const page = { width: 210, height: 297, textLeft: 22, textRight: 198 }

export function layout(values) {
  const [year, month, day] = values.date.split('-')
  const paragraphs = [
    [
      'We hereby state and u undertake that goods supplied to M/s.',
      { value: values.party.trim() || '[Party name]' },
      'bearing NTN:',
      { value: values.ntn.trim() || '[NTN]' },
      'vide sales tax invoice No.',
      { value: values.invoice.trim() || '[Invoice number]' },
      'dated',
      { value: day ? `${day}/${month}/${year}` : '[Invoice date]' },
      'has been by us and Income Tax thereon has already been paid u/s 148 of ITO 2001, at the Import stage. Therefore, no further tax is deductible at supply stage u/s 153(1) of ITO 2001 as envisaged vide section 153(5)(a) of the Income Tax Ordinance, 2001.',
    ],
    ['Sales Tax shall not be deducted at the time of payment accordance to SRO. 897 dated 04/10/2011 being a Commercial Importer.'],
    ['Full amount of invoice shall be made without deduction of any amount of tax.'],
  ]
  const pdf = new jsPDF({ format: 'a4' })
  const lines = []
  let y = 136
  const fontSize = 14
  pdf.setFont('times', 'normal').setFontSize(fontSize)
  const lineWidth = page.textRight - page.textLeft
  const spaceWidth = pdf.getTextWidth(' ')

  for (const paragraph of paragraphs) {
    let words = []
    let width = 0
    function finishLine(justify) {
      const gap = spaceWidth + (justify && words.length > 1 ? (lineWidth - width) / (words.length - 1) : 0)
      let x = page.textLeft
      const positionedWords = words.map(word => {
        const placement = { ...word, x }
        x += word.width + gap
        return placement
      })
      lines.push({ y, words: positionedWords })
      y += 8.5
      words = []
      width = 0
    }

    for (const segment of paragraph) {
      const bold = typeof segment !== 'string'
      pdf.setFont('times', bold ? 'bold' : 'normal')
      const value = bold ? segment.value : segment
      for (const token of value.split(/\s+/)) {
        const pieces = pdf.getTextWidth(token) > lineWidth ? pdf.splitTextToSize(token, lineWidth) : [token]
        for (const piece of pieces) {
          const pieceWidth = pdf.getTextWidth(piece)
          if (words.length && width + spaceWidth + pieceWidth > lineWidth) finishLine(true)
          if (words.length) width += spaceWidth
          words.push({ text: piece, bold, width: pieceWidth })
          width += pieceWidth
        }
      }
    }
    finishLine(false)
    y += 4
  }
    return { lines, fontSize, fits: lines.at(-1).y < 224 }
}

export function makePdf(document, image, { party, invoice }) {
  const { lines, fontSize } = document
  const pdf = new jsPDF({ format: 'a4' })
  pdf.addImage(image, 'PNG', 0, 0, page.width, page.height, 'letterhead', 'FAST')
  pdf.setFont('times', 'bold').setFontSize(18)
  pdf.text('UNDERTAKING', 105, 113, { align: 'center' })
  pdf.setLineWidth(0.4).line(77, 114.3, 133, 114.3)
  pdf.setFontSize(fontSize)
  for (const line of lines) {
    for (const word of line.words) {
      pdf.setFont('times', word.bold ? 'bold' : 'normal')
      pdf.text(word.text, word.x, line.y)
    }
  }
    const filenamePart = value => value.normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  const partyName = [...filenamePart(party)].slice(0, 65).join('').replace(/-+$/, '') || 'Party'
  const invoiceNumber = filenamePart(invoice) || 'Unspecified'
  const name = `${partyName}-Invoice-${invoiceNumber}.pdf`
  return new File([pdf.output('blob')], name, { type: 'application/pdf' })
}
