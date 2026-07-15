import OpenAI from 'openai'
import { buildOpenAIMessages } from '@/lib/marketingDirector/prompts'
import type { MarketingDirectorContext } from '@/lib/marketingDirector/types'
import type { DirectorMessage } from '@/lib/marketingDirector/types'

export function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  return { apiKey, model, keyPresent: Boolean(apiKey) }
}

export function logOpenAIConfig(context: string) {
  const { keyPresent, model } = getOpenAIConfig()
  console.log(`[marketing-director:${context}] OPENAI_API_KEY present:`, keyPresent)
  console.log(`[marketing-director:${context}] OPENAI_MODEL:`, model)
  if (!keyPresent) {
    console.error(
      '[marketing-director] OPENAI_API_KEY is missing. Set OPENAI_API_KEY=sk-proj-... in .env.local (not NEXT_PUBLIC_) and restart the dev server.',
    )
  }
}

export async function callMarketingDirectorOpenAI(
  context: MarketingDirectorContext,
  history: DirectorMessage[],
  userMessage: string,
): Promise<{ reply: string; model: string }> {
  const { apiKey, model } = getOpenAIConfig()
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add OPENAI_API_KEY=sk-proj-... to .env.local and restart npm run dev.',
    )
  }

  const messages = buildOpenAIMessages(context, history, userMessage)
  const client = new OpenAI({ apiKey })

  console.log('[marketing-director] Calling OpenAI', { model, messageCount: messages.length })

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    })

    const reply = completion.choices[0]?.message?.content?.trim()
    if (!reply) {
      console.error('[marketing-director] OpenAI returned empty content', completion)
      throw new Error('OpenAI returned an empty response. Try again or check your model name.')
    }

    console.log('[marketing-director] OpenAI call succeeded', {
      model: completion.model,
      usage: completion.usage,
      replyLength: reply.length,
    })

    return { reply, model: completion.model ?? model }
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      console.error('[marketing-director] OpenAI APIError', {
        status: err.status,
        code: err.code,
        type: err.type,
        message: err.message,
      })
      throw new Error(`OpenAI API error (${err.status}): ${err.message}`)
    }
    console.error('[marketing-director] OpenAI call failed', err)
    throw err instanceof Error ? err : new Error(String(err))
  }
}
