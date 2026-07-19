export type ExecutionProviderId = 'claude-code' | 'openai-codex' | 'gemini-cli' | 'cursor' | 'copilot' | 'custom'

export type ExecutionProviderAdapter = {
  id: ExecutionProviderId
  displayName: string
  /** Whether this provider is actually wired to a real execution path today — never true unless it genuinely is. */
  available: boolean
  /** Known, permanent constraints of this provider's runtime — not bugs, not fixable from this codebase, disclosed rather than hidden. */
  knownLimitations: string[]
}

/**
 * The provider abstraction the Workforce is built against, kept
 * deliberately separate from both the Workforce Orchestrator and every
 * agent — neither contains any provider-specific logic. Today exactly one
 * provider is real: Claude Code, via the existing Runtime
 * (lib/dev/runtime/claudeRuntime.ts), which this file does not
 * reimplement or wrap — it only identifies it. Adding a second working
 * provider means implementing its own execution module elsewhere and
 * flipping its `available` flag here; it does not require touching the
 * Workforce or any agent, since none of them call a provider directly —
 * only the one shared Runtime execution does, once per task, regardless
 * of how many agents reviewed it.
 *
 * The actual execution contract a new provider implements is
 * `ExecutionProvider` in lib/dev/runtime/executionProviders/types.ts,
 * registered in lib/dev/runtime/claudeRuntime.ts's dispatch table. Note
 * that contract requires real filesystem/shell tool-use — a text-only API
 * call (e.g. a raw OpenAI Responses API completion) cannot implement it
 * without an entirely separate tool-use harness (file read/write/shell
 * tools, an agent loop) built around it first; simply calling the API is
 * not sufficient to make 'openai-codex' a real second entry here.
 *
 * Claude Code's own known limitation — recursive execution: if the
 * process running this app is itself inside an active Claude Code coding
 * session, Claude Code's tool-permission safeguards block a nested
 * `claude` invocation before it spawns (confirmed directly: attempting it
 * from within such a session was denied by Claude Code's own classifier,
 * not by this app). This is an external runtime constraint, not something
 * fixable here, and not a reason to route around it with workarounds — a
 * real CEO running the deployed app normally is unaffected (see the real,
 * successful historical job in .vyron-dev/runtime-jobs.json). A future
 * provider that isn't itself a coding-agent CLI (i.e. doesn't run its own
 * nested agent session) would not carry this specific constraint, though
 * it would still need its own tool-use harness per the note above.
 */
const PROVIDERS: ExecutionProviderAdapter[] = [
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    available: true,
    knownLimitations: ['Recursive execution from within Claude Code sessions is not supported.'],
  },
  { id: 'openai-codex', displayName: 'OpenAI Codex', available: false, knownLimitations: [] },
  { id: 'gemini-cli', displayName: 'Gemini CLI', available: false, knownLimitations: [] },
  { id: 'cursor', displayName: 'Cursor', available: false, knownLimitations: [] },
  { id: 'copilot', displayName: 'Copilot', available: false, knownLimitations: [] },
  { id: 'custom', displayName: 'Custom Internal Agent', available: false, knownLimitations: [] },
]

export function listExecutionProviders(): ExecutionProviderAdapter[] {
  return PROVIDERS
}

/** The provider the shared Runtime execution actually uses today. */
export function getActiveProvider(): ExecutionProviderAdapter {
  return PROVIDERS[0]
}
