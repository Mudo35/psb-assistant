import { Fragment, type ReactNode } from 'react'

// Render markdown sederhana dari jawaban AI: **tebal**, *miring*, `kode`, [tautan](https://...),
// daftar (- / * / 1.), dan judul (#). Tanpa library tambahan dan tanpa dangerouslySetInnerHTML.
const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > last) nodes.push(text.slice(last, start))
    if (match[1] !== undefined) nodes.push(<strong key={key++} className="font-semibold">{renderInline(match[1])}</strong>)
    else if (match[2] !== undefined) nodes.push(<code key={key++} className="rounded bg-slate-900/10 px-1 py-0.5 font-mono text-[0.85em]">{match[2]}</code>)
    else if (match[3] !== undefined) nodes.push(<em key={key++}>{match[3]}</em>)
    else nodes.push(<a key={key++} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{match[4]}</a>)
    last = start + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'h'; text: string }

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd()
    const ul = line.match(/^\s*[-*•]\s+(.*)$/)
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/)
    const heading = line.match(/^#{1,6}\s+(.*)$/)
    const prev = blocks[blocks.length - 1]

    if (!line.trim()) {
      blocks.push({ type: 'p', lines: [] }) // baris kosong = pemisah paragraf
    } else if (heading) {
      blocks.push({ type: 'h', text: heading[1] })
    } else if (ul || ol) {
      const type = ul ? 'ul' : 'ol'
      const item = (ul ?? ol)![1]
      if (prev && prev.type === type) prev.items.push(item)
      else blocks.push({ type, items: [item] })
    } else if (prev && prev.type === 'p' && prev.lines.length > 0) {
      prev.lines.push(line)
    } else if (prev && prev.type === 'p') {
      prev.lines.push(line)
    } else {
      blocks.push({ type: 'p', lines: [line] })
    }
  }
  return blocks.filter((b) => !(b.type === 'p' && b.lines.length === 0))
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, i) => {
        if (block.type === 'h') return <p key={i} className="font-semibold">{renderInline(block.text)}</p>
        if (block.type === 'ul' || block.type === 'ol') {
          const List = block.type
          return (
            <List key={i} className={`space-y-1 pl-5 ${block.type === 'ul' ? 'list-disc' : 'list-decimal'}`}>
              {block.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
            </List>
          )
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
