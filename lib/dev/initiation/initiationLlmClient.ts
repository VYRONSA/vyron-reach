import OpenAI from 'openai'

/**
 * Direct OpenAI call for the Initiation Assessor — same shape as
 * lib/marketingDirector/openai.ts's callMarketingDirectorOpenAI (own env
 * vars, own low temperature suited to structured extraction rather than
 * conversation, `response_format: json_object` to bias the model toward
 * parseable output). Deliberately not the `claude -p` CLI path
 * (lib/dev/runtime/ execution machinery) — that path shells out to an
 * interactive coding agent with filesystem/tool access and a long timeout
 * budget, appropriate for executing a batch, not a single structured-JSON
 * planning call; using it here would also entangle Initiation with
 * directorLock/job-queue machinery it doesn't need (per the approved
 * plan's v1 text-only decision).
 */
export function getInitiationLlmConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.INITIATION_OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  return { apiKey, model, keyPresent: Boolean(apiKey) }
}

export type InitiationLlmResult = { content: string; model: string }

export async function callInitiationLlm(systemPrompt: string, userPrompt: string): Promise<InitiationLlmResult> {
  const { apiKey, model } = getInitiationLlmConfig()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Add OPENAI_API_KEY=sk-proj-... to .env.local and restart npm run dev.')
  }

  const client = new OpenAI({ apiKey })

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.25,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('OpenAI returned an empty response. Try again or check your model name.')

    return { content, model: completion.model ?? model }
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error (${err.status}): ${err.message}`)
    }
    throw err instanceof Error ? err : new Error(String(err))
  }
}
