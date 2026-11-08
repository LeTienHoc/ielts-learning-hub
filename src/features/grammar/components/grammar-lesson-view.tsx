import { Lightbulb } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GrammarLesson } from "@/lib/content/grammar-schema"

type Language = "en" | "vi"

type GrammarLessonViewProps = {
  lesson: GrammarLesson
  /** The learner's explanation language is shown first; the other one is one tap away. */
  explanationLanguage: Language
}

const OTHER_LANGUAGE_LABEL: Record<Language, string> = {
  en: "Đọc bằng tiếng Việt",
  vi: "Read in English",
}

/** Text in the learner's language, with the other language behind a disclosure. */
function Bilingual({ en, vi, language }: { en: string; vi: string; language: Language }) {
  const [first, second] = language === "vi" ? [vi, en] : [en, vi]
  const otherLanguage: Language = language === "vi" ? "en" : "vi"
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-body-lg text-foreground" lang={language}>
        {first}
      </p>
      <details className="group text-body-sm text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded-sm text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {OTHER_LANGUAGE_LABEL[language]}
        </summary>
        <p className="pt-1" lang={otherLanguage}>
          {second}
        </p>
      </details>
    </div>
  )
}

/** A short grammar lesson (GRAM-02): why, when, examples, typical mistakes and an IELTS tip. */
export function GrammarLessonView({ lesson, explanationLanguage }: GrammarLessonViewProps) {
  const language = explanationLanguage
  return (
    <article className="flex max-w-3xl flex-col gap-8">
      <Bilingual en={lesson.introEn} vi={lesson.introVi} language={language} />

      {lesson.sections.map((section) => (
        <section key={section.heading} className="flex flex-col gap-3">
          <h2 className="text-h4 text-foreground">{section.heading}</h2>
          <Bilingual en={section.bodyEn} vi={section.bodyVi} language={language} />
          {section.examples.length > 0 && (
            <ul aria-label={`Examples: ${section.heading}`} className="flex flex-col gap-2">
              {section.examples.map((example) => (
                <li
                  key={example.en}
                  className="rounded-md border-l-2 border-primary bg-primary-subtle/40 px-3 py-2"
                >
                  <p className="text-body font-medium text-foreground" lang="en">
                    {example.en}
                  </p>
                  {example.vi && (
                    <p className="text-body-sm text-muted-foreground" lang="vi">
                      {example.vi}
                    </p>
                  )}
                  {example.note && (
                    <p className="text-caption text-muted-foreground">{example.note}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-h4 text-foreground">Common mistakes</h2>
        <ul aria-label="Common mistakes" className="flex flex-col gap-3">
          {lesson.commonMistakes.map((mistake) => (
            <li
              key={mistake.wrong}
              className="flex flex-col gap-1 rounded-md border border-border p-3"
            >
              <p className="text-body text-error-emphasis">
                <span className="sr-only">Wrong: </span>
                <span className="line-through">{mistake.wrong}</span>
              </p>
              <p className="text-body font-medium text-success-emphasis">
                <span className="sr-only">Right: </span>
                {mistake.right}
              </p>
              <p className="text-body-sm text-muted-foreground" lang={language}>
                {language === "vi" ? mistake.whyVi : mistake.whyEn}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Lightbulb aria-hidden="true" className="size-5 text-warning" />
          <CardTitle className="text-h4">
            <h2>IELTS tip</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Bilingual en={lesson.ieltsTipEn} vi={lesson.ieltsTipVi} language={language} />
        </CardContent>
      </Card>
    </article>
  )
}
