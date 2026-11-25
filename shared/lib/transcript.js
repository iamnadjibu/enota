/**
 * Official transcript PDF (text-based, selectable and searchable).
 * One trainee can have several marks records (one per faculty/department);
 * all of them appear on a single transcript with a cumulative summary.
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import QRCode from 'qrcode'
import logoUrl from '../brand/logo-full.png'
import { summarise, cumulative, gradeComment, GRADE_SCALE, PASS_MARK } from './grading'

const C = {
  ink: [17, 24, 22],
  muted: [92, 107, 101],
  line: [214, 226, 220],
  brand: [3, 95, 64],
  brandMid: [23, 129, 93],
  mint: [233, 248, 240],
  fail: [180, 35, 24],
}

const SITE = 'https://enotaportal.web.app'

async function toDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

function docId(regNumber, date) {
  // Short, human-readable reference printed on the document.
  let h = 0
  const s = `${regNumber}|${date.toISOString().slice(0, 10)}`
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return `ENT-${date.getFullYear()}-${h.toString(36).toUpperCase().padStart(7, '0')}`
}

const fmtDate = d => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

/**
 * @param {object[]} records  marks records for ONE trainee (same regNumber)
 * @param {object}   opts     { portalName, issuer, save: true|false }
 * @returns {Promise<jsPDF>}
 */
export async function buildTranscript(records, opts = {}) {
  if (!records?.length) throw new Error('No records')
  const first = records[0]
  const name = `${first.firstName || ''} ${first.lastName || ''}`.trim()
  const reg = (first.regNumber || '').toUpperCase()
  const issued = new Date()
  const ref = docId(reg, issued)
  const verifyUrl = `${SITE}/marks?reg=${encodeURIComponent(reg)}`

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const H = pdf.internal.pageSize.getHeight()
  const M = 16

  const [logo, qr] = await Promise.all([
    toDataUrl(logoUrl).catch(() => null),
    QRCode.toDataURL(verifyUrl, { margin: 0, width: 240, color: { dark: '#035F40', light: '#FFFFFF' } }).catch(() => null),
  ])

  // ---------- header ----------
  pdf.setFillColor(...C.brand)
  pdf.rect(0, 0, W, 4, 'F')
  if (logo) pdf.addImage(logo, 'PNG', M, 11, 24, 17)
  pdf.setTextColor(...C.ink)
  pdf.setFont('helvetica', 'bold').setFontSize(17)
  pdf.text('ACADEMIC TRANSCRIPT', W - M, 18, { align: 'right' })
  pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...C.muted)
  pdf.text(opts.portalName || 'eNOTA Portal · NAD Production', W - M, 23.5, { align: 'right' })
  pdf.text(`Ref ${ref}  ·  Issued ${fmtDate(issued)}`, W - M, 28, { align: 'right' })
  pdf.setDrawColor(...C.line).setLineWidth(0.3)
  pdf.line(M, 34, W - M, 34)

  // ---------- trainee details ----------
  const faculties = [...new Set(records.map(r => r.faculty).filter(Boolean))]
  const institutions = [...new Set(records.map(r => r.institution).filter(Boolean))]
  const detail = [
    ['Trainee', name || '—', 'Registration no.', reg || '—'],
    ['Gender', first.gender || '—', 'Institution', institutions.join(', ') || '—'],
    ['Programmes', faculties.join(', ') || '—', 'Records', String(records.length)],
  ]
  autoTable(pdf, {
    startY: 38,
    margin: { left: M, right: M },
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 1.6, bottom: 1.6, left: 0, right: 3 }, textColor: C.ink },
    columnStyles: {
      0: { textColor: C.muted, cellWidth: 26 }, 1: { fontStyle: 'bold', cellWidth: 64 },
      2: { textColor: C.muted, cellWidth: 30 }, 3: { fontStyle: 'bold' },
    },
    body: detail,
  })

  // ---------- one table per faculty record ----------
  let y = pdf.lastAutoTable.finalY + 6
  const sorted = [...records].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
  for (const r of sorted) {
    const s = summarise(r.marks)
    if (y > H - 60) { pdf.addPage(); y = 20 }
    pdf.setFillColor(...C.mint)
    pdf.roundedRect(M, y, W - 2 * M, 9, 1.5, 1.5, 'F')
    pdf.setFont('helvetica', 'bold').setFontSize(10.5).setTextColor(...C.brand)
    pdf.text((r.faculty || 'General programme').toUpperCase(), M + 3, y + 6)
    pdf.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...C.muted)
    const when = (r.updatedAt || r.createdAt || '').slice(0, 10)
    pdf.text([r.institution, when && `Recorded ${when}`].filter(Boolean).join('  ·  '), W - M - 3, y + 6, { align: 'right' })

    autoTable(pdf, {
      startY: y + 11,
      margin: { left: M, right: M },
      head: [['#', 'Course / module', 'Score', 'Grade', 'Result']],
      body: s.courses.map((c, i) => [i + 1, c.course, c.score === null ? '—' : `${c.score}%`, c.grade, c.passed ? 'Pass' : 'Fail']),
      foot: [['', 'Programme average', `${s.average.toFixed(2)}%`, s.grade, `${s.passed}/${s.total} passed`]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 2.4, lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
      headStyles: { fillColor: C.brand, textColor: 255, fontStyle: 'bold' },
      footStyles: { fillColor: [245, 250, 247], textColor: C.ink, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', textColor: C.muted },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 30, halign: 'center' },
      },
      didParseCell: d => {
        if (d.section === 'body' && d.column.index === 4 && d.cell.raw === 'Fail') d.cell.styles.textColor = C.fail
      },
    })
    y = pdf.lastAutoTable.finalY + 7
  }

  // ---------- cumulative summary ----------
  const cum = cumulative(records)
  if (y > H - 75) { pdf.addPage(); y = 20 }
  pdf.setDrawColor(...C.brandMid).setLineWidth(0.5)
  pdf.roundedRect(M, y, W - 2 * M, 30, 2, 2, 'S')
  const cols = [
    ['Courses taken', String(cum.courses)],
    ['Courses passed', `${cum.passed}`],
    ['Cumulative average', `${cum.average.toFixed(2)}%`],
    ['Overall grade', cum.grade],
  ]
  const cw = (W - 2 * M) / 4
  cols.forEach(([label, value], i) => {
    const x = M + cw * i + cw / 2
    pdf.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...C.muted)
    pdf.text(label.toUpperCase(), x, y + 9, { align: 'center' })
    pdf.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...C.brand)
    pdf.text(value, x, y + 18, { align: 'center' })
  })
  pdf.setFont('helvetica', 'italic').setFontSize(9).setTextColor(...C.ink)
  pdf.text(gradeComment(cum.grade), W / 2, y + 26, { align: 'center', maxWidth: W - 2 * M - 10 })
  y += 36

  // ---------- grading key + verification (kept together) ----------
  if (y > H - 78) { pdf.addPage(); y = 20 }
  pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...C.ink)
  pdf.text('Grading scale', M, y + 3)
  autoTable(pdf, {
    startY: y + 5,
    margin: { left: M, right: M },
    head: [GRADE_SCALE.map(g => g.grade)],
    body: [
      GRADE_SCALE.map((g, i) => `${g.min}–${i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1}`),
      GRADE_SCALE.map(g => g.label),
    ],
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.4, halign: 'center', lineColor: C.line, lineWidth: 0.2, textColor: C.ink },
    headStyles: { fillColor: C.brandMid, textColor: 255, fontStyle: 'bold' },
  })
  y = pdf.lastAutoTable.finalY + 8

  if (qr) pdf.addImage(qr, 'PNG', M, y, 26, 26)
  const tx = M + 31
  pdf.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...C.ink)
  pdf.text('Verify this transcript', tx, y + 5)
  pdf.setFont('helvetica', 'normal').setFontSize(8.2).setTextColor(...C.muted)
  pdf.text(pdf.splitTextToSize(`Scan the code or visit ${SITE}/marks and search ${reg}. The online record is authoritative. Pass mark: ${PASS_MARK}%.`, 78), tx, y + 10)

  // signature line
  const sx = W - M - 62
  pdf.setDrawColor(...C.muted).setLineWidth(0.2)
  pdf.line(sx, y + 20, W - M, y + 20)
  pdf.setFontSize(8).setTextColor(...C.muted)
  pdf.text(opts.issuer || 'Academic Registrar, NAD Production', sx, y + 24.5)

  // ---------- footer on every page ----------
  const pages = pdf.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p)
    pdf.setDrawColor(...C.line).setLineWidth(0.2)
    pdf.line(M, H - 14, W - M, H - 14)
    pdf.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...C.muted)
    pdf.text(`${name} · ${reg} · ${ref}`, M, H - 9)
    pdf.text(`Page ${p} of ${pages}`, W - M, H - 9, { align: 'right' })
    pdf.setFillColor(...C.brand)
    pdf.rect(0, H - 3, W, 3, 'F')
  }

  pdf.setProperties({ title: `Transcript — ${name} (${reg})`, subject: 'Academic transcript', author: 'eNOTA Portal', creator: 'eNOTA Portal' })
  return pdf
}

export async function downloadTranscript(records, opts) {
  const pdf = await buildTranscript(records, opts)
  const first = records[0]
  const safe = `${first.firstName || ''}_${first.lastName || ''}_${first.regNumber || ''}`.replace(/[^\w-]+/g, '_')
  pdf.save(`Transcript_${safe}.pdf`)
}
