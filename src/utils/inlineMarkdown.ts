export interface InlinePart {
  text: string
  bold?: boolean
  italic?: boolean
  link?: boolean
}

const ESCAPED_STAR = '\uE000'

/** 把步骤、说明里的 Markdown 拆成可分段显示的文字。图片标记去掉，不加载外部图。 */
export function inlineParts(source: string): InlinePart[] {
  const text = source.replace(/\\\*/g, ESCAPED_STAR)
  return parse(text, false, false).map((part) => ({
    ...part,
    text: part.text.replaceAll(ESCAPED_STAR, '*'),
  }))
}

export function hasInlineText(source: string): boolean {
  return inlineParts(source).some((part) => part.text.trim().length > 0)
}

interface Style {
  bold: boolean
  italic: boolean
}

function parse(source: string, bold: boolean, italic: boolean): InlinePart[] {
  const parts: InlinePart[] = []
  let buf = ''
  let i = 0

  const flush = (extra?: Partial<InlinePart>) => {
    const text = extra?.text ?? buf
    if (extra?.text === undefined) buf = ''
    if (!text) return
    const part: InlinePart = { text }
    if (extra?.bold ?? bold) part.bold = true
    if (extra?.italic ?? italic) part.italic = true
    if (extra?.link) part.link = true
    const prev = parts[parts.length - 1]
    if (prev && prev.bold === part.bold && prev.italic === part.italic && prev.link === part.link) {
      prev.text += part.text
      return
    }
    parts.push(part)
  }

  while (i < source.length) {
    if (source.startsWith('![', i)) {
      const image = readWrapped(source, i + 1)
      if (image) {
        flush()
        i = image.end
        continue
      }
    }
    if (source[i] === '[') {
      const link = readWrapped(source, i)
      if (link) {
        flush()
        parts.push(...parse(link.label, bold, italic))
        if (/^https?:\/\//i.test(link.url)) flush({ text: ` ${link.url}`, link: true, bold: false, italic: false })
        i = link.end
        continue
      }
    }
    if (source.startsWith('**', i)) {
      const close = source.indexOf('**', i + 2)
      if (close !== -1 && !source.slice(i + 2, close).includes('\n')) {
        flush()
        parts.push(...parse(source.slice(i + 2, close), true, italic))
        i = close + 2
        continue
      }
    }
    if (isItalicOpen(source, i)) {
      const close = findItalicClose(source, i + 1)
      if (close !== -1) {
        flush()
        parts.push(...parse(source.slice(i + 1, close), bold, true))
        i = close + 1
        continue
      }
    }
    buf += source[i]
    i += 1
  }
  flush()
  return parts
}

function isItalicOpen(source: string, index: number): boolean {
  if (source[index] !== '*' || source[index + 1] === '*' || source[index + 1] === undefined) return false
  return !/\s/.test(source[index + 1])
}

function findItalicClose(source: string, from: number): number {
  for (let i = from; i < source.length; i += 1) {
    if (source[i] === '\n') return -1
    if (source[i] === '*' && source[i + 1] !== '*' && !/\s/.test(source[i - 1] ?? '')) return i
  }
  return -1
}

function readWrapped(source: string, index: number): { label: string; url: string; end: number } | null {
  if (source[index] !== '[') return null
  const close = source.indexOf('](', index)
  if (close === -1) return null
  const end = source.indexOf(')', close + 2)
  if (end === -1) return null
  const label = source.slice(index + 1, close)
  if (label.includes('\n')) return null
  return { label, url: source.slice(close + 2, end), end: end + 1 }
}
