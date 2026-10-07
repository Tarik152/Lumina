import OpenAI from 'openai'
import type { ChatMessage } from '../index.js'

const SYSTEM_PROMPT = `You are Lumina AI, an intelligent study assistant.
The user may reference uploaded PDFs, images, or videos by name as context.
Answer any question clearly — summaries, explanations, quizzes, or anything the user asks.
Be concise but thorough. Use markdown (bold, lists, code) when it helps readability.`

export async function chatOpenAI(
  messages: ChatMessage[],
  fileNames: string[],
  pdfContext: string,
  images: { mime: string; data: string }[],
  onToken: (t: string) => void,
): Promise<void> {
  const key = process.env.GITHUB_TOKEN
  if (!key) throw new Error('GITHUB_TOKEN is not set in Back/.env')

  const client = new OpenAI({ apiKey: key, baseURL: 'https://models.inference.ai.azure.com' })

  const latest = messages[messages.length - 1].text
  const hints: string[] = []
  if (fileNames.length > 0) hints.push(`Attached files: ${fileNames.join(', ')}`)
  if (pdfContext) hints.push(`The user uploaded PDFs with the following content:\n${pdfContext}`)
  const textPrefix = hints.length > 0 ? `${hints.join('\n')}\n\n` : ''

  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'model' ? 'assistant' as const : 'user' as const,
    content: m.text,
  }))

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
  if (textPrefix || latest) {
    userContent.push({ type: 'text', text: textPrefix + latest })
  }
  for (const img of images) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${img.mime};base64,${img.data}` },
    })
  }

  try {
    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userContent },
      ],
      stream: true,
    })

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content
      if (token) onToken(token)
    }
  } catch (err: any) {
    const msg = err?.message ?? ''
    if (images.length > 0 && (msg.includes('image input') || msg.includes('clipboard') || msg.includes('vision') || msg.includes('multimodal'))) {
      const names = fileNames.length > 0 ? fileNames.join(', ') : 'the attached image'
      onToken(`I cannot process images directly — my current model does not support vision. I can only see the filename (${names}). If you describe what the image contains, I'll do my best to help.`)
      return
    }
    throw err
  }
}

export async function generateTitle(userText: string, aiResponse: string): Promise<string> {
  const key = process.env.GITHUB_TOKEN
  if (!key) return 'New chat'

  const client = new OpenAI({ apiKey: key, baseURL: 'https://models.inference.ai.azure.com' })

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    messages: [
      { role: 'system', content: 'Generate a short title (max 6 words) for a study conversation. Respond with ONLY the title — no quotes, no punctuation, no markdown.' },
      { role: 'user', content: userText || 'User sent a file to study' },
      { role: 'assistant', content: aiResponse },
    ],
  })

  return completion.choices[0]?.message?.content?.trim() || 'New chat'
}
