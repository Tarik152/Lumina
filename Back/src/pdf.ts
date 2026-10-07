import { PDFParse } from 'pdf-parse'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from '@napi-rs/canvas'
import Tesseract from 'tesseract.js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STANDARD_FONT_URL = join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/'
const TEXT_THRESHOLD = 50

export async function extractPDFText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer)

  const parser = new PDFParse({ data: uint8 })
  const result = await parser.getText()
  const text = result.text.trim()

  if (text.length >= TEXT_THRESHOLD) return text

  const doc = await pdfjsLib.getDocument({ data: uint8, standardFontDataUrl: STANDARD_FONT_URL }).promise
  const totalPages = doc.numPages
  const worker = await Tesseract.createWorker('eng+fra')
  let ocrText = ''

  try {
    for (let i = 1; i <= totalPages; i++) {
      const page = await doc.getPage(i)
      const viewport = page.getViewport({ scale: 2 })
      const cvs = createCanvas(viewport.width, viewport.height)
      const ctx = cvs.getContext('2d')
      await page.render({ canvas: null, canvasContext: ctx, viewport } as any).promise
      const png = cvs.toBuffer('image/png')
      const { data } = await worker.recognize(png)
      ocrText += `--- Page ${i} ---\n${data.text}\n\n`
      page.cleanup()
    }
  } finally {
    await worker.terminate()
  }

  return ocrText || text
}
