import * as XLSX from 'xlsx'

const ACCEPT = '.pdf,.md,.txt,.csv,.xlsx,.docx'
export { ACCEPT }

export async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'md' || ext === 'txt' || ext === 'csv') {
    return readAsText(file)
  }

  if (ext === 'xlsx') {
    return extractXlsx(file)
  }

  if (ext === 'docx') {
    return extractDocx(file)
  }

  if (ext === 'pdf') {
    return extractPdf(file)
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

async function extractXlsx(file: File): Promise<string> {
  const buf = await readAsArrayBuffer(file)
  const wb = XLSX.read(buf, { type: 'array' })
  const lines: string[] = []
  for (const sheetName of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName])
    if (csv.trim()) lines.push(`[Sheet: ${sheetName}]\n${csv}`)
  }
  return lines.join('\n\n')
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const buf = await readAsArrayBuffer(file)
  const result = await mammoth.extractRawText({ arrayBuffer: buf })
  return result.value
}

async function extractPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).href

  const buf = await readAsArrayBuffer(file)
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n\n')
}
