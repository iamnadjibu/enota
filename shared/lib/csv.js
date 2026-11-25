/**
 * Safe CSV export.
 * - Escapes quotes and wraps every cell in quotes.
 * - Neutralises spreadsheet formulas: cells starting with = + - @ or a tab/CR
 *   are prefixed with an apostrophe so Excel/Sheets show them as text.
 *   Plain numbers (e.g. -5 or 72.5) are left as numbers.
 * - Adds a UTF-8 BOM so Excel shows accented names correctly.
 */
export function safeCell(value) {
  if (value === null || value === undefined) return '""'
  let s = String(value)
  const isNumber = /^-?\d+(\.\d+)?$/.test(s.trim())
  if (!isNumber && /^[=+\-@\t\r]/.test(s)) s = "'" + s
  return '"' + s.replace(/"/g, '""') + '"'
}

/** rows: array of objects (keys become headers) or { headers, rows } arrays. */
export function toCSV(rows, headers) {
  if (!rows.length && !headers) return ''
  const cols = headers || Object.keys(rows[0])
  const lines = [cols.map(safeCell).join(',')]
  for (const r of rows) lines.push(cols.map(c => safeCell(Array.isArray(r) ? r[cols.indexOf(c)] : r[c])).join(','))
  return lines.join('\r\n')
}

export function downloadCSV(csv, filename) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
