import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const CHATS_FILE = join(DATA_DIR, 'chats.json')
const LIBRARY_FILE = join(DATA_DIR, 'library.json')

export interface StoredMessage {
  id: number
  role: 'user' | 'ai'
  text: string
  files?: string[]
  error?: boolean
}

export interface StoredChat {
  id: number
  title: string
  date: string
  messages: StoredMessage[]
}

export interface StoredLibraryFile {
  id: number
  name: string
  type: 'pdf' | 'image' | 'video'
  size: string
  date: string
}

interface StoreData {
  chats: StoredChat[]
  library: StoredLibraryFile[]
}

async function ensureDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
}

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(file, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJSON<T>(file: string, data: T): Promise<void> {
  await ensureDir()
  await writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
}

export async function loadChats(): Promise<StoredChat[]> {
  return readJSON<StoredChat[]>(CHATS_FILE, [])
}

export async function saveChats(chats: StoredChat[]): Promise<void> {
  await writeJSON(CHATS_FILE, chats)
}

export async function loadLibrary(): Promise<StoredLibraryFile[]> {
  return readJSON<StoredLibraryFile[]>(LIBRARY_FILE, [])
}

export async function saveLibrary(library: StoredLibraryFile[]): Promise<void> {
  await writeJSON(LIBRARY_FILE, library)
}

export async function loadAll(): Promise<StoreData> {
  const [chats, library] = await Promise.all([loadChats(), loadLibrary()])
  return { chats, library }
}

export async function saveAll(data: StoreData): Promise<void> {
  await ensureDir()
  await Promise.all([
    writeJSON(CHATS_FILE, data.chats),
    writeJSON(LIBRARY_FILE, data.library),
  ])
}
