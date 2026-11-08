// View types of the practice engine. Type-only re-exports, so Client Components can use them
// without importing server code.
export type {
  AnswerKey,
  AttemptMode,
  AttemptState,
  PracticeQuestion,
  PracticeQuestionGroup,
  PracticeSetDetail,
  PracticeSetSummary,
} from "@/server/practice/practice-service"
