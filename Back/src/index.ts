import express, { Request, Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { chatOpenAI, generateTitle } from './providers/openai.js'
import { loadAll, saveAll, type StoredChat, type StoredLibraryFile, type StoredMessage } from './store.js'
import { extractPDFText } from './pdf.js'

const app  = express()
const PORT = process.env.PORT ?? 3001

/* ── Middleware ───────────────────────────────────── */
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      cb(null, true)
    } else {
      cb(new Error(`CORS blocked: ${origin}`))
    }
  },
}))
app.use(express.json({ limit: '50mb' }))

/* ── Types ────────────────────────────────────────── */
export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface UploadedFile {
  name: string
  data: string
  type: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  fileNames?: string[]
  files?: UploadedFile[]
}

/* ── Data persistence ────────────────────────────── */
app.get('/api/data', async (_req, res) => {
  const data = await loadAll()
  res.json(data)
})

app.put('/api/data', async (req, res) => {
  const { chats, library } = req.body as { chats: StoredChat[]; library: StoredLibraryFile[] }
  await saveAll({ chats, library })
  res.json({ ok: true })
})

/* ── Health check ─────────────────────────────────── */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    provider: 'openai',
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
  })
})

/* ── Chat endpoint (streaming) ────────────────────── */
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages } = req.body as ChatRequest

  if (!messages || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' })
    return
  }

  // SSE headers — stream tokens to the browser as they arrive
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const send = (token: string) => res.write(`data: ${JSON.stringify({ token })}\n\n`)
  const done  = ()             => { res.write('data: [DONE]\n\n'); res.end() }
  const error = (msg: string)  => { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end() }

  try {
    const body = req.body as ChatRequest
    const files = body.files ?? []
    const names = body.fileNames ?? []
    let pdfContext = ''
    const images: { mime: string; data: string }[] = []

    for (const f of files) {
      const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      const isImage = f.type.startsWith('image/')
      if (isPDF) {
        const buf = Buffer.from(f.data, 'base64')
        const text = await extractPDFText(buf)
        if (text) {
          pdfContext += `\n--- Content of "${f.name}" ---\n${text.slice(0, 50000)}\n--- End of "${f.name}" ---\n`
        } else {
          pdfContext += `\n--- "${f.name}" appears to be a scanned document with no extractable text. The user may need to describe what it contains. ---\n`
        }
      } else if (isImage) {
        images.push({ mime: f.type, data: f.data })
      }
    }

    await chatOpenAI(messages, names, pdfContext, images, send)
    done()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[chat error]', msg)
    error(msg)
  }
})

/* ── Generate chat title from first exchange ────── */
app.post('/api/title', async (req, res) => {
  const { userText, aiResponse } = req.body as { userText?: string; aiResponse: string }
  if (!aiResponse) { res.status(400).json({ error: 'aiResponse is required' }); return }
  const title = await generateTitle(userText ?? '', aiResponse)
  res.json({ title })
})

app.listen(PORT, () => {
  console.log(`\n  Lumina backend running on http://localhost:${PORT}`)
  console.log(`  Provider : openai (${process.env.OPENAI_MODEL ?? 'gpt-4o'})\n`)
})
