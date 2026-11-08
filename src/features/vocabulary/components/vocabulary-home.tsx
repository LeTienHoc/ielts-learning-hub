import { getVocabularyOverview } from "@/server/vocabulary/vocabulary-service"

import { VocabularyHomeView } from "./vocabulary-home-view"

/** Vocabulary home (VOC-05). Reads the session: render inside <Suspense>. */
export async function VocabularyHome() {
  const overview = await getVocabularyOverview()
  return <VocabularyHomeView overview={overview} />
}
