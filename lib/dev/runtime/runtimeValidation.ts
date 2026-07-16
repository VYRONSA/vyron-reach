export type ClaudeCliOutput = {
  sessionId: string | null
  uuid: string | null
  resultText: string
  costUsd: number | null
  durationMs: number | null
  usage: { inputTokens: number | null; outputTokens: number | null } | null
}

export type RuntimeValidationResult = { valid: true; output: ClaudeCliOutput } | { valid: false; reason: string }

/**
 * Validates the JSON `claude -p --output-format json` writes to stdout.
 * This app doesn't own or control Claude Code's exact output schema, so
 * every field beyond "did this parse, and is there a result" is read
 * defensively (present if the field exists and is the expected type, null
 * otherwise) rather than assumed — never fabricate a session id or cost
 * figure that wasn't actually in the response. Malformed or errored
 * output is rejected outright rather than partially accepted.
 */
export function validateClaudeOutput(stdout: string): RuntimeValidationResult {
  const trimmed = stdout.trim()
  if (!trimmed) return { valid: false, reason: 'Claude produced no output on stdout.' }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { valid: false, reason: 'Claude did not return valid JSON on stdout.' }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { valid: false, reason: 'Claude JSON output was not an object.' }
  }

  const record = parsed as Record<string, unknown>

  if (record.is_error === true) {
    const reason = typeof record.result === 'string' && record.result.trim() ? record.result : 'Claude reported an error.'
    return { valid: false, reason }
  }

  const resultText = typeof record.result === 'string' ? record.result.trim() : ''
  if (!resultText) {
    return { valid: false, reason: 'Claude JSON output had no usable "result" text.' }
  }

  const usageRecord = typeof record.usage === 'object' && record.usage !== null ? (record.usage as Record<string, unknown>) : null

  return {
    valid: true,
    output: {
      sessionId: typeof record.session_id === 'string' ? record.session_id : null,
      uuid: typeof record.uuid === 'string' ? record.uuid : null,
      resultText,
      costUsd: typeof record.total_cost_usd === 'number' ? record.total_cost_usd : null,
      durationMs: typeof record.duration_ms === 'number' ? record.duration_ms : null,
      usage: usageRecord
        ? {
            inputTokens: typeof usageRecord.input_tokens === 'number' ? usageRecord.input_tokens : null,
            outputTokens: typeof usageRecord.output_tokens === 'number' ? usageRecord.output_tokens : null,
          }
        : null,
    },
  }
}
