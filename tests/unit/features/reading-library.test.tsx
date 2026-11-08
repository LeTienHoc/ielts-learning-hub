import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ReadingFilterNav } from "@/features/reading/components/reading-filters"
import { ReadingHistoryList } from "@/features/reading/components/reading-history-list"
import { ReadingSetList } from "@/features/reading/components/reading-set-list"
import type { PracticeSetSummary, ReadingHistoryItem } from "@/features/practice/types"

const practiceSet: PracticeSetSummary = {
  id: "s1",
  slug: "reading-rooftop-gardens",
  title: "Rooftop gardens",
  summary: "Green roofs in cities.",
  level: "B1",
  topics: ["environment"],
  questionCount: 10,
  testTimeLimitSeconds: 1200,
  kind: "practice",
  questionTypes: ["true_false_not_given", "sentence_completion"],
  passageCount: 1,
}
const fullTest: PracticeSetSummary = {
  ...practiceSet,
  id: "s2",
  slug: "reading-full-test-1",
  title: "Academic Reading test 1",
  level: "B2",
  questionCount: 40,
  testTimeLimitSeconds: 3600,
  kind: "full_test",
  questionTypes: ["matching_headings"],
  passageCount: 3,
}

describe("ReadingFilterNav", () => {
  it("marks the active filters and links to the other choices", () => {
    render(
      <ReadingFilterNav
        filters={{ type: "true_false_not_given", level: "B1" }}
        types={["true_false_not_given", "matching_headings"]}
      />,
    )

    const types = screen.getByRole("navigation", { name: "Filter by question type" })
    expect(within(types).getByRole("link", { name: "True / False / Not Given" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(within(types).getByRole("link", { name: "Matching headings" })).toHaveAttribute(
      "href",
      "/reading?type=matching_headings&level=B1",
    )
    const levels = screen.getByRole("navigation", { name: "Filter by level" })
    expect(within(levels).getByRole("link", { name: "B1" })).toHaveAttribute("aria-current", "page")
    expect(within(levels).getByRole("link", { name: "B2" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/reading")
  })

  it("has no clear link without filters", () => {
    render(<ReadingFilterNav filters={{}} types={["matching_headings"]} />)
    expect(screen.queryByRole("link", { name: "Clear filters" })).not.toBeInTheDocument()
  })
})

describe("ReadingSetList", () => {
  it("shows full tests, question types and the test time", () => {
    render(<ReadingSetList sets={[practiceSet, fullTest]} />)

    const [first, second] = screen.getAllByRole("listitem")
    if (!first || !second) throw new Error("Missing sets")
    expect(first).toHaveTextContent("True / False / Not Given")
    expect(first).not.toHaveTextContent("Full test")
    expect(second).toHaveTextContent("Full test")
    expect(second).toHaveTextContent("3 passages")
    expect(second).toHaveTextContent("Test: 60 min")
    expect(within(second).getByRole("link", { name: "Academic Reading test 1" })).toHaveAttribute(
      "href",
      "/reading/reading-full-test-1",
    )
  })

  it("explains when no set matches the filters", () => {
    render(<ReadingSetList sets={[]} />)
    expect(screen.getByText("No sets match these filters")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Clear filters" })).toHaveAttribute("href", "/reading")
  })
})

describe("ReadingHistoryList", () => {
  const items: ReadingHistoryItem[] = [
    {
      attemptId: "a1",
      setSlug: "reading-full-test-1",
      setTitle: "Academic Reading test 1",
      kind: "full_test",
      mode: "test",
      submittedAt: "2026-11-08T10:00:00Z",
      score: 30,
      maxScore: 40,
      band: 7,
    },
    {
      attemptId: "a2",
      setSlug: "reading-rooftop-gardens",
      setTitle: "Rooftop gardens",
      kind: "practice",
      mode: "learn",
      submittedAt: "2026-11-07T10:00:00Z",
      score: 8,
      maxScore: 13,
      band: null,
    },
  ]

  it("shows the band for full tests and the score otherwise, linking to the results", () => {
    render(<ReadingHistoryList items={items} />)

    const [first, second] = screen.getAllByRole("listitem")
    if (!first || !second) throw new Error("Missing attempts")
    expect(first).toHaveTextContent("Estimated band 7")
    expect(first).toHaveTextContent("Test mode")
    expect(second).toHaveTextContent("8 / 13")
    expect(second).toHaveTextContent("Learn mode")
    expect(second).not.toHaveTextContent("band")
    expect(within(first).getByRole("link", { name: /Academic Reading test 1/ })).toHaveAttribute(
      "href",
      "/reading/reading-full-test-1/attempt/a1/review",
    )
    expect(first.querySelector("time")).toHaveAttribute("datetime", "2026-11-08T10:00:00Z")
  })
})
