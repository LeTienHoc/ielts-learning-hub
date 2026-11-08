import { splitParagraphs } from "../utils/answers"

type PassageViewProps = {
  title: string | null
  text: string
}

/** Reading passage with comfortable long-form typography. */
export function PassageView({ title, text }: PassageViewProps) {
  return (
    <article aria-label="Reading passage" className="flex flex-col gap-4">
      {title && <h2 className="text-h4 text-foreground">{title}</h2>}
      {splitParagraphs(text).map((paragraph, index) => (
        // Paragraphs are static content in a fixed order, so the index is a stable key.
        <p key={index} className="text-body-lg text-foreground">
          {paragraph}
        </p>
      ))}
    </article>
  )
}
