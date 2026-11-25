/**
 * Extract trainee marks from an uploaded file with Gemini (Firebase AI Logic).
 *
 * PDF and image files are sent to Gemini directly. Word (.docx) and Excel
 * (.xlsx/.xls/.csv) files are first converted to text/HTML tables in the
 * browser, because Gemini does not read those formats natively.
 *
 * Setup (one time, Firebase console): Build → AI Logic → Get started →
 * "Gemini Developer API". Enabling App Check is strongly recommended.
 */
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai'
import { app } from '../firebase'

const MODEL = 'gemini-2.5-flash'
const MAX_BYTES = 15 * 1024 * 1024 // stay under the inline-data limit

export const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.xls,.csv'

const schema = Schema.object({
  properties: {
    students: Schema.array({
      items: Schema.object({
        properties: {
          firstName: Schema.string({ description: 'Given name(s), as written' }),
          lastName: Schema.string({ description: 'Family name, as written' }),
          regNumber: Schema.string({ description: 'Registration number, e.g. KSP0101998. Empty string if missing.' }),
          gender: Schema.string({ description: 'Male, Female, or empty string if not stated' }),
          marks: Schema.array({
            items: Schema.object({
              properties: {
                course: Schema.string({ description: 'Course or module name in UPPER CASE' }),
                score: Schema.number({ description: 'Score as a percentage from 0 to 100' }),
              },
            }),
          }),
        },
        optionalProperties: ['gender'],
      }),
    }),
    warnings: Schema.array({ items: Schema.string(), description: 'Anything unclear: unreadable cells, scores not out of 100, merged names, etc.' }),
  },
})

let model
function getModel() {
  if (!model) {
    // App Check tokens are attached automatically; limited-use tokens add
    // replay protection for Gemini calls.
    const ai = getAI(app, { backend: new GoogleAIBackend(), useLimitedUseAppCheckTokens: true })
    model = getGenerativeModel(ai, {
      model: MODEL,
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0 },
    })
  }
  return model
}

const ext = name => (name.split('.').pop() || '').toLowerCase()

async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Convert a file into Gemini content parts. */
export async function fileToParts(file) {
  if (file.size > MAX_BYTES) throw new Error('This file is larger than 15 MB. Split it into smaller files.')
  const e = ext(file.name)

  if (e === 'pdf' || file.type.startsWith('image/')) {
    const mimeType = e === 'pdf' ? 'application/pdf' : file.type
    return [{ inlineData: { data: await toBase64(file), mimeType } }]
  }
  if (e === 'docx') {
    const mammoth = await import('mammoth/mammoth.browser.js')
    const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
    return [{ text: `Document "${file.name}" converted to HTML:\n\n${value}` }]
  }
  if (['xlsx', 'xls', 'csv'].includes(e)) {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheets = wb.SheetNames.map(n => `### Sheet: ${n}\n${XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false })}`)
    return [{ text: `Spreadsheet "${file.name}" converted to CSV:\n\n${sheets.join('\n\n')}` }]
  }
  throw new Error('Unsupported file type. Use PDF, an image, Word (.docx) or Excel (.xlsx, .xls, .csv).')
}

/**
 * @returns {Promise<{students: object[], warnings: string[]}>}
 */
export async function extractMarks(file, { faculty, knownCourses = [], note = '' } = {}) {
  const parts = await fileToParts(file)
  const prompt = [
    'You extract trainee marks from academic mark sheets for eNOTA Portal (NAD Production, Rwanda).',
    `The sheet belongs to the faculty/department: ${faculty || 'unknown'}.`,
    knownCourses.length ? `Courses already used in this faculty (prefer these exact names when they match): ${knownCourses.join(', ')}.` : '',
    'Rules:',
    '- Return one entry per trainee. Keep names exactly as written; put the family name in lastName when it is clear, otherwise split on the last word.',
    '- Registration numbers look like KSP0101998; return them in UPPER CASE without spaces. Use an empty string if a row has none.',
    '- Convert every score to a percentage out of 100. If a column is out of another maximum (e.g. /20 or /50), scale it and add a warning.',
    '- Ignore totals, averages, ranks and grade-letter columns; only return per-course scores.',
    '- Never invent trainees, courses or scores. If a cell is unreadable, leave that course out for that trainee and add a warning.',
    note ? `Extra instructions from the admin: ${note}` : '',
  ].filter(Boolean).join('\n')

  const result = await getModel().generateContent([{ text: prompt }, ...parts])
  let data
  try {
    data = JSON.parse(result.response.text())
  } catch {
    throw new Error('The AI response could not be read. Try again, or try a clearer file.')
  }
  const warnings = [...(data.warnings || [])]
  const students = (data.students || []).map(s => {
    const firstName = (s.firstName || '').trim()
    const lastName = (s.lastName || '').trim()
    const marks = {}
    for (const m of s.marks || []) {
      const course = (m.course || '').trim().toUpperCase()
      if (!course) continue
      const score = toNumber(m.score)
      // A missing score must stay empty for the admin to fill in, never become 0.
      if (score === null) {
        warnings.push(`${firstName} ${lastName}: no readable score for ${course}, left empty.`.trim())
        continue
      }
      marks[course] = Math.round(score * 100) / 100
    }
    return {
      firstName,
      lastName,
      regNumber: (s.regNumber || '').replace(/\s+/g, '').toUpperCase(),
      gender: /^f/i.test(s.gender || '') ? 'Female' : /^m/i.test(s.gender || '') ? 'Male' : '',
      marks,
    }
  })
  return { students, warnings }
}

/** A finite number from an AI value, or null (null, '', 'abs' and NaN are not scores). */
export function toNumber(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v !== 'string' || !v.trim()) return null
  const n = Number(v.trim())
  return Number.isFinite(n) ? n : null
}

/** Friendlier messages for common AI Logic failures. */
export function aiErrorMessage(err) {
  const msg = String(err?.message || '')
  if (/api-not-enabled|not been used|AI Logic|firebasevertexai|firebaseml/i.test(msg)) {
    return 'Gemini is not enabled for this Firebase project yet. In the Firebase console open Build → AI Logic → Get started and choose the Gemini Developer API.'
  }
  if (/quota|429|RESOURCE_EXHAUSTED/i.test(msg)) return 'The AI quota has been reached. Wait a minute and try again.'
  if (/app.?check/i.test(msg)) return 'App Check blocked the request. Check the App Check settings for AI Logic.'
  if (/network|fetch/i.test(msg)) return 'No connection to the AI service. Check your internet and try again.'
  return msg || 'The file could not be processed.'
}
