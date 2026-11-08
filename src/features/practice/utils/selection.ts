import type { TextRange } from "./highlights"

/** Length of the text from the start of `paragraph` to a boundary point inside it. */
function offsetWithin(paragraph: Element, node: Node, offset: number): number {
  const range = document.createRange()
  range.selectNodeContents(paragraph)
  range.setEnd(node, offset)
  return range.toString().length
}

/**
 * Maps the browser selection to passage offsets. Passage paragraphs are rendered with
 * `data-offset` (their start in the passage text); the parts of the selection outside them
 * (title, other page content) are ignored. Null when nothing in the passage is selected.
 */
export function rangeFromSelection(container: HTMLElement, selection: Selection): TextRange | null {
  if (selection.rangeCount === 0 || selection.isCollapsed) return null
  const selected = selection.getRangeAt(0)

  let start = Number.POSITIVE_INFINITY
  let end = Number.NEGATIVE_INFINITY
  for (const paragraph of container.querySelectorAll<HTMLElement>("[data-offset]")) {
    if (!selected.intersectsNode(paragraph)) continue
    const base = Number(paragraph.dataset.offset)
    const length = paragraph.textContent.length
    if (!Number.isFinite(base)) continue
    const localStart = paragraph.contains(selected.startContainer)
      ? offsetWithin(paragraph, selected.startContainer, selected.startOffset)
      : 0
    const localEnd = paragraph.contains(selected.endContainer)
      ? offsetWithin(paragraph, selected.endContainer, selected.endOffset)
      : length
    if (localEnd <= localStart) continue
    start = Math.min(start, base + localStart)
    end = Math.max(end, base + localEnd)
  }
  return end > start ? { start, end } : null
}
