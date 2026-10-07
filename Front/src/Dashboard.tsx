import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

const BACKEND = ''  // proxied through Vite → http://localhost:3001
const MAX_FILE_SIZE = 20 * 1024 * 1024  // 20 MB

/* ── Helpers ─────────────────────────────────────── */
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/* ── Types ────────────────────────────────────────── */
interface AttachedFile {
  name: string
  type: string
  data: string
  size: number
}

interface Message {
  id: number
  role: 'user' | 'ai'
  text: string
  files?: string[]
  error?: boolean
}

interface Chat {
  id: number
  title: string
  date: string
  messages: Message[]
}

interface LibraryFile {
  id: number
  name: string
  type: 'pdf' | 'image' | 'video'
  size: string
  date: string
}

/* ── Icons ────────────────────────────────────────── */
const IconPlus   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z"/></svg>
const IconChat   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/></svg>
const IconBook   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/></svg>
const IconHome   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/></svg>
const IconAttach = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4.5a4.5 4.5 0 009 0V6a1 1 0 112 0v5.5a6.5 6.5 0 11-13 0V7a5 5 0 0110 0v4.5a2.5 2.5 0 01-5 0V8a1 1 0 012 0v3.5a.5.5 0 001 0V7a3 3 0 00-3-3z" clipRule="evenodd"/></svg>
const IconSend   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
const IconTrash  = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
const IconFile   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
const IconX      = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
const IconUpload = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
const IconWarn   = () => <svg viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>

const FILE_TYPE_COLORS: Record<LibraryFile['type'], string> = {
  pdf: '#ef4444', image: '#8b5cf6', video: '#f59e0b',
}

/* ── Date label helper ───────────────────────────── */
function dateLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── Render markdown-lite (bold + line breaks) ───── */
function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
    return <p key={i} dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
  })
}

/* ── Backend offline banner ──────────────────────── */
function OfflineBanner() {
  return (
    <div className="db-no-key">
      <div className="db-no-key-icon"><IconWarn /></div>
      <div>
        <strong>Backend is not running</strong>
        <p>
          Open a terminal in <code>Back/</code> and run:<br />
          <code>npm run dev</code>
        </p>
      </div>
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────── */
type SidePanel = 'chats' | 'library'

interface SidebarProps {
  panel: SidePanel
  setPanel: (p: SidePanel) => void
  chats: Chat[]
  activeChatId: number | null
  onSelectChat: (id: number) => void
  onNewChat: () => void
  onDeleteChat: (id: number) => void
  library: LibraryFile[]
  onDeleteFile: (id: number) => void
}

function Sidebar({ panel, setPanel, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, library, onDeleteFile }: SidebarProps) {
  const grouped = chats.reduce<Record<string, Chat[]>>((acc, c) => {
    acc[c.date] = [...(acc[c.date] ?? []), c]
    return acc
  }, {})

  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-logo">
        <Link to="/" className="db-logo">
          <span className="db-logo-icon">L</span>
          Lumina<span className="db-logo-ai">AI</span>
        </Link>
      </div>

      <button className="db-new-chat" onClick={onNewChat}>
        <IconPlus /> New chat
      </button>

      <div className="db-tabs">
        <button className={panel === 'chats' ? 'db-tab active' : 'db-tab'} onClick={() => setPanel('chats')}>
          <IconChat /> Chats
        </button>
        <button className={panel === 'library' ? 'db-tab active' : 'db-tab'} onClick={() => setPanel('library')}>
          <IconBook /> Library
        </button>
      </div>

      <div className="db-panel-content">
        {panel === 'chats' && (
          <div className="db-chat-list">
            {chats.length === 0
              ? <p className="db-empty-panel">No conversations yet.</p>
              : Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <p className="db-group-label">{date}</p>
                  {items.map(c => (
                    <div
                      key={c.id}
                      className={`db-chat-item ${c.id === activeChatId ? 'active' : ''}`}
                      onClick={() => onSelectChat(c.id)}
                    >
                      <span className="db-chat-title">{c.title}</span>
                      <button
                        className="db-chat-delete"
                        onClick={e => { e.stopPropagation(); onDeleteChat(c.id) }}
                        title="Delete"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}

        {panel === 'library' && (
          <div className="db-library-list">
            {library.length === 0
              ? <p className="db-empty-panel">No files uploaded yet.</p>
              : <>
                  <p className="db-group-label">All files</p>
                  {library.map(f => (
                    <div key={f.id} className="db-lib-item">
                      <span className="db-lib-icon" style={{ color: FILE_TYPE_COLORS[f.type] }}>
                        <IconFile />
                      </span>
                      <div className="db-lib-info">
                        <span className="db-lib-name">{f.name}</span>
                        <span className="db-lib-meta">{f.type.toUpperCase()} · {f.size} · {f.date}</span>
                      </div>
                      <button className="db-chat-delete" onClick={() => onDeleteFile(f.id)} title="Remove">
                        <IconX />
                      </button>
                    </div>
                  ))}
                </>
            }
          </div>
        )}
      </div>

      <div className="db-sidebar-footer">
        <Link to="/" className="db-home-link">
          <IconHome /> Back to home
        </Link>
      </div>
    </aside>
  )
}

/* ── Message bubble ──────────────────────────────── */
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`db-msg ${isUser ? 'db-msg-user' : 'db-msg-ai'}`}>
      {!isUser && <span className="db-ai-avatar">✦</span>}
      <div className="db-msg-body">
        {msg.files && msg.files.length > 0 && (
          <div className="db-msg-files">
            {msg.files.map(f => (
              <span key={f} className="db-msg-file-tag"><IconFile />{f}</span>
            ))}
          </div>
        )}
        <div className={`db-msg-text ${msg.error ? 'db-msg-error' : ''}`}>
          {renderText(msg.text)}
        </div>
      </div>
    </div>
  )
}

/* ── Streaming bubble (token by token) ──────────── */
function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="db-msg db-msg-ai">
      <span className="db-ai-avatar">✦</span>
      <div className="db-msg-body">
        <div className="db-msg-text">
          {renderText(text)}
          <span className="db-cursor">|</span>
        </div>
      </div>
    </div>
  )
}

/* ── Thinking bubble ─────────────────────────────── */
function ThinkingBubble() {
  return (
    <div className="db-msg db-msg-ai">
      <span className="db-ai-avatar">✦</span>
      <div className="db-msg-body">
        <div className="db-msg-text db-thinking">
          <span /><span /><span />
        </div>
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────── */
function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  const suggestions = [
    'Summarise my uploaded PDF',
    'Quiz me on what I uploaded',
    'Explain the diagram on page 5',
    'What are the key concepts here?',
  ]
  return (
    <div className="db-empty">
      <div className="db-empty-icon">✦</div>
      <h2>What's on your mind?</h2>
      <p>Upload a file or just start asking — no setup needed.</p>
      <div className="db-suggestions">
        {suggestions.map(s => (
          <button key={s} className="db-suggestion" onClick={() => onSuggestion(s)}>{s}</button>
        ))}
      </div>
    </div>
  )
}

/* ── Main Dashboard ──────────────────────────────── */
export default function Dashboard() {
  const [chats, setChats]                 = useState<Chat[]>([])
  const [activeChatId, setActiveChatId]   = useState<number | null>(null)
  const [panel, setPanel]                 = useState<SidePanel>('chats')
  const [library, setLibrary]             = useState<LibraryFile[]>([])
  const [input, setInput]                 = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [loadingFiles, setLoadingFiles]   = useState<Set<string>>(new Set())
  const [streaming, setStreaming]         = useState(false)
  const [streamText, setStreamText]       = useState('')
  const [thinking, setThinking]           = useState(false)
  const [backendOnline, setBackendOnline] = useState(true)

  const fileInputRef   = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const abortRef       = useRef<AbortController | null>(null)
  const persistTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeChat = chats.find(c => c.id === activeChatId) ?? null

  /* load persisted data on mount */
  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${BACKEND}/api/data`)
        if (resp.ok) {
          const data = await resp.json()
          if (data.chats?.length) setChats(data.chats)
          if (data.library?.length) setLibrary(data.library)
        }
      } catch {}
    })()
  }, [])

  /* persist to backend */
  const saveData = useCallback(async (c: Chat[], l: LibraryFile[]) => {
    try {
      await fetch(`${BACKEND}/api/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chats: c, library: l }),
      })
    } catch {}
  }, [])

  /* persist data to backend (debounced) */
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      saveData(chats, library)
    }, 500)
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current) }
  }, [chats, library, saveData])

  /* auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, streaming, streamText, thinking])

  /* ensure there is always one active chat */
  const ensureChat = useCallback((): number => {
    if (activeChatId !== null) return activeChatId
    const id = Date.now()
    setChats(prev => [{ id, title: 'New chat', date: dateLabel(), messages: [] }, ...prev])
    setActiveChatId(id)
    return id
  }, [activeChatId])

  /* auto-grow textarea */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  /* send to backend */
  const handleSend = useCallback(async (text = input) => {
    const trimmed = text.trim()
    if ((!trimmed && attachedFiles.length === 0) || streaming || thinking || loadingFiles.size > 0) return

    const chatId = ensureChat()

    /* capture image names before clearing attachedFiles */
    const imageNames = attachedFiles.filter(f => f.type.startsWith('image/')).map(f => f.name)

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      files: attachedFiles.length > 0 ? attachedFiles.map(f => f.name) : undefined,
    }

    /* snapshot history BEFORE adding user msg (what the backend needs) */
    const prevMessages = chats.find(c => c.id === chatId)?.messages ?? []

    /* add user message + auto-title on first message */
    setChats(prev => prev.map(c =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? trimmed.slice(0, 40) : c.title }
        : c
    ))

    setInput('')
    setAttachedFiles([])
    setLoadingFiles(new Set())
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    /* build history array for backend */
    const messages = [
      ...prevMessages.map(m => ({ role: m.role === 'user' ? 'user' as const : 'model' as const, text: m.text })),
      { role: 'user' as const, text: trimmed },
    ]

    try {
      setThinking(true)
      const ctrl = new AbortController()
      abortRef.current = ctrl

      const resp = await fetch(`${BACKEND}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          fileNames: attachedFiles.map(f => f.name),
          files: attachedFiles.map(f => ({ name: f.name, data: f.data, type: f.type })),
        }),
        signal: ctrl.signal,
      })

      if (!resp.ok) {
        throw new Error(`Backend returned ${resp.status}`)
      }

      setThinking(false)
      setStreaming(true)

      const reader  = resp.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let buf  = ''
      let visionErrorDetected = false

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data) as { token?: string; error?: string }
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.token) {
              /* detect vision error streamed as model content */
              if (!visionErrorDetected && /cannot\s+read.*clipboard|does\s+not\s+support\s+image/i.test(parsed.token)) {
                visionErrorDetected = true
                full = ''
                continue
              }
              if (visionErrorDetected) continue
              full += parsed.token
              setStreamText(full)
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'JSON') throw e
          }
        }
      }

      if (visionErrorDetected) {
        const names = imageNames.length > 0 ? imageNames.join(', ') : 'the attached image'
        full = `I cannot process images directly — my current model does not support vision. I can only see the filename (${names}). If you describe what the image contains, I'll do my best to help.`
      }

      const aiMsg: Message = { id: Date.now(), role: 'ai', text: full }
      const wasFirstMessage = prevMessages.length === 0
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, aiMsg] } : c
      ))
      setBackendOnline(true)

      /* generate title from first exchange */
      if (wasFirstMessage && full.trim()) {
        fetch(`${BACKEND}/api/title`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userText: trimmed, aiResponse: full }),
        }).then(r => r.json()).then(data => {
          if (data.title) {
            setChats(prev => prev.map(c =>
              c.id === chatId ? { ...c, title: data.title } : c
            ))
          }
        }).catch(() => {})
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      const raw = err instanceof Error ? err.message : 'Unknown error'
      const isNetworkError = raw.includes('Failed to fetch') || raw.includes('NetworkError') || raw.includes('ECONNREFUSED') || raw.includes('Load failed')
      const friendly = isNetworkError
        ? 'Cannot reach the backend — make sure you ran `npm run dev` in the Back/ folder.'
        : raw
      if (isNetworkError) setBackendOnline(false)
      else setBackendOnline(true)
      const errMsg: Message = { id: Date.now(), role: 'ai', text: friendly, error: true }
      setChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, errMsg] } : c
      ))
    } finally {
      setThinking(false)
      setStreaming(false)
      setStreamText('')
      abortRef.current = null
    }
  }, [input, streaming, thinking, attachedFiles, chats, ensureChat])

  /* new chat */
  const handleNewChat = () => {
    const id = Date.now()
    setChats(prev => [{ id, title: 'New chat', date: dateLabel(), messages: [] }, ...prev])
    setActiveChatId(id)
    setInput('')
    setAttachedFiles([])
    abortRef.current?.abort()
  }

  /* delete chat */
  const handleDeleteChat = (id: number) => {
    if (activeChatId === id) abortRef.current?.abort()
    setChats(prev => {
      const next = prev.filter(c => c.id !== id)
      if (activeChatId === id) setActiveChatId(next.length > 0 ? next[0].id : null)
      return next
    })
  }

  /* file attach */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? [])
    const names = fileList.map(f => f.name)

    /* reject oversized files */
    const oversized = fileList.filter(f => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      const msg = oversized.map(f => `${f.name} (${formatSize(f.size)}) exceeds the ${formatSize(MAX_FILE_SIZE)} limit`).join('\n')
      alert(msg)
      const ok = fileList.filter(f => f.size <= MAX_FILE_SIZE)
      if (ok.length === 0) { e.target.value = ''; return }
      fileList.length = 0; fileList.push(...ok)
    }

    setLoadingFiles(prev => new Set([...prev, ...names]))

    Promise.all(fileList.map(f => new Promise<AttachedFile>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        const data = result.includes(',') ? result.split(',')[1] : result
        resolve({ name: f.name, type: f.type, data, size: f.size })
      }
      reader.onerror = () => reject(new Error(`Failed to read ${f.name}`))
      reader.readAsDataURL(f)
    }))).then(attached => {
      setAttachedFiles(prev => [...prev, ...attached])
      const newLibItems: LibraryFile[] = fileList.map((f, i) => ({
        id: Date.now() + i,
        name: f.name,
        type: f.type.startsWith('image') ? 'image' : f.type.startsWith('video') ? 'video' : 'pdf',
        size: formatSize(f.size),
        date: dateLabel(),
      }))
      setLibrary(prev => [...newLibItems, ...prev])
    }).catch(err => {
      console.error('File read error:', err)
    }).finally(() => {
      setLoadingFiles(prev => {
        const next = new Set(prev)
        names.forEach(n => next.delete(n))
        return next
      })
    })

    e.target.value = ''
  }

  /* keyboard send */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const filesLoading = loadingFiles.size > 0
  const busy = streaming || thinking || filesLoading

  return (
    <div className="db-root">
      <Sidebar
        panel={panel} setPanel={setPanel}
        chats={chats} activeChatId={activeChatId}
        onSelectChat={id => { abortRef.current?.abort(); setActiveChatId(id) }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        library={library}
        onDeleteFile={id => setLibrary(prev => prev.filter(f => f.id !== id))}
      />

      <main className="db-main">
        {/* Top bar */}
        <header className="db-topbar">
          <span className="db-chat-name">{activeChat?.title ?? 'New chat'}</span>
          <div className="db-topbar-actions">
            <button className="db-topbar-btn" onClick={() => fileInputRef.current?.click()}>
              <IconUpload /> Upload file
            </button>
          </div>
        </header>

        {/* Backend offline banner */}
        {!backendOnline && <OfflineBanner />}

        {/* Messages */}
        <div className="db-messages">
          {!activeChat || activeChat.messages.length === 0 && !busy
            ? <EmptyState onSuggestion={s => handleSend(s)} />
            : (
              <>
                {activeChat.messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                {thinking && <ThinkingBubble />}
                {streaming && <StreamingBubble text={streamText} />}
                <div ref={messagesEndRef} />
              </>
            )
          }
        </div>

        {/* Input area */}
        <div className="db-input-area">
          {(attachedFiles.length > 0 || loadingFiles.size > 0) && (
            <div className="db-attached-files">
              {attachedFiles.map((f, i) => {
                const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
                const isImage = f.type.startsWith('image/')
                const pillClass = isPDF ? 'db-attached-pill pdf' : isImage ? 'db-attached-pill image' : 'db-attached-pill'
                return (
                  <span key={i} className={pillClass}>
                    <IconFile />
                    <span className="db-pill-name">{f.name}</span>
                    <span className="db-pill-size">{formatSize(f.size)}</span>
                    <button onClick={() => setAttachedFiles(prev => prev.filter((_, j) => j !== i))}>
                      <IconX />
                    </button>
                  </span>
                )
              })}
              {[...loadingFiles].map(name => (
                <span key={name} className="db-attached-pill loading">
                  <span className="db-loading-spinner" />
                  <IconFile />{name}
                </span>
              ))}
            </div>
          )}

          <div className="db-input-row">
            <button className="db-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach file">
              <IconAttach />
            </button>
            <textarea
              ref={textareaRef}
              className="db-textarea"
              placeholder="Ask anything about your files, or just type a question…"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`db-send-btn ${((!input.trim() && attachedFiles.length === 0) || busy) ? 'disabled' : ''}`}
              onClick={() => handleSend()}
              disabled={(!input.trim() && attachedFiles.length === 0) || busy}
            >
              <IconSend />
            </button>
          </div>
          <p className="db-input-hint">Enter to send · Shift+Enter for new line · Max {formatSize(MAX_FILE_SIZE)} per file</p>
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.avi"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
