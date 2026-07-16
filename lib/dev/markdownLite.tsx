import type { ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const tokens: ReactNode[] = []
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    const key = `${keyPrefix}-${i++}`
    if (token.startsWith('**')) {
      tokens.push(
        <strong key={key} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('`')) {
      tokens.push(
        <code key={key} className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-300">
          {token.slice(1, -1)}
        </code>
      )
    } else {
      tokens.push(
        <em key={key} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      )
    }
    lastIndex = match.index + token.length
  }
  if (lastIndex < text.length) tokens.push(text.slice(lastIndex))
  return tokens
}

/**
 * Minimal markdown-style renderer: #/##/### headers, - / * lists, **bold**,
 * *italic*, `code`, and paragraphs. Intentionally lightweight — no external
 * markdown dependency, just enough for lightweight knowledge notes.
 */
export function renderMarkdownLite(text: string): ReactNode {
  if (!text.trim()) return null
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let listBuffer: string[] = []
  let blockIndex = 0

  const flushList = () => {
    if (listBuffer.length === 0) return
    blocks.push(
      <ul key={`list-${blockIndex++}`} className="my-2 list-disc space-y-1 pl-5">
        {listBuffer.map((item, idx) => (
          <li key={idx} className="text-sm text-slate-300">
            {renderInline(item, `li-${blockIndex}-${idx}`)}
          </li>
        ))}
      </ul>
    )
    listBuffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const listMatch = line.match(/^\s*[-*]\s+(.*)$/)
    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/)

    if (listMatch) {
      listBuffer.push(listMatch[1])
      continue
    }
    flushList()

    if (headerMatch) {
      const level = headerMatch[1].length
      const content = headerMatch[2]
      const key = `h-${blockIndex++}`
      if (level === 1) {
        blocks.push(
          <h3 key={key} className="mt-4 text-base font-semibold text-slate-100 first:mt-0">
            {renderInline(content, key)}
          </h3>
        )
      } else if (level === 2) {
        blocks.push(
          <h4 key={key} className="mt-3 text-sm font-semibold text-slate-200 first:mt-0">
            {renderInline(content, key)}
          </h4>
        )
      } else {
        blocks.push(
          <h5 key={key} className="mt-2 text-sm font-medium text-slate-300 first:mt-0">
            {renderInline(content, key)}
          </h5>
        )
      }
      continue
    }

    if (line.trim() === '') {
      continue
    }

    blocks.push(
      <p key={`p-${blockIndex++}`} className="text-sm leading-relaxed text-slate-300">
        {renderInline(line, `p-${blockIndex}`)}
      </p>
    )
  }
  flushList()

  return <div className="space-y-2">{blocks}</div>
}
