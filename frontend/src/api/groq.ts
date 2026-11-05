import Groq from 'groq-sdk'
import type { AttackFamily } from '../types/api'

const FAM_LABEL: Record<string, string> = {
  instruction_override: 'Instruction Override',
  role_play_jailbreak: 'Role Play / Jailbreak',
  delimiter_escape: 'Delimiter Escape',
  encoding_obfuscation: 'Encoding / Obfuscation',
  context_exfiltration: 'Context Exfiltration',
  indirect_injection: 'Indirect Injection',
}

function getClient(): Groq {
  const key = import.meta.env.VITE_GROQ_API_KEY
  if (!key) throw new Error('VITE_GROQ_API_KEY is not set')
  return new Groq({ apiKey: key, dangerouslyAllowBrowser: true })
}

export async function askGroqOnBlock(
  userText: string,
  attackFamily: AttackFamily,
): Promise<string> {
  const client = getClient()
  const familyLabel = FAM_LABEL[attackFamily] ?? attackFamily
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          `You are a cybersecurity assistant for a prompt injection detection system. ` +
          `The user's input was flagged as a "${familyLabel}" prompt injection attack. ` +
          `In 2-3 short sentences: explain what this attack type does and why it is dangerous. ` +
          `Then suggest what the user should do instead if they have a legitimate goal. ` +
          `Be direct and practical. Do not repeat the user's text back.`,
      },
      { role: 'user', content: userText.slice(0, 2000) },
    ],
    max_tokens: 200,
    temperature: 0.4,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}

export async function askGroqOnAllow(
  userText: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful, concise AI assistant. Answer the user\'s question directly and accurately. Keep responses under 150 words unless detail is genuinely needed.',
      },
      ...conversationHistory.slice(-6),
      { role: 'user', content: userText },
    ],
    max_tokens: 300,
    temperature: 0.7,
  })
  return completion.choices[0]?.message?.content?.trim() ?? ''
}
