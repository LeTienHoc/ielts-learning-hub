import {
  getVocabularyOverview,
  getWeeklyGoal,
  getWordGarden,
} from "@/server/vocabulary/vocabulary-service"

import { VocabularyHomeView } from "./vocabulary-home-view"
import { WeeklyGoal } from "./weekly-goal"
import { WordGarden } from "./word-garden"

/** Vocabulary home (VOC-05) with the weekly goal and word garden. Render inside <Suspense>. */
export async function VocabularyHome() {
  const [overview, weekly, garden] = await Promise.all([
    getVocabularyOverview(),
    getWeeklyGoal(),
    getWordGarden(),
  ])

  if (overview.myWordsCount === 0) return <VocabularyHomeView overview={overview} />

  return (
    <div className="flex flex-col gap-6">
      <WeeklyGoal daysThisWeek={weekly.daysThisWeek} goal={weekly.goal} />
      <VocabularyHomeView overview={overview} />
      <WordGarden beds={garden} />
    </div>
  )
}
