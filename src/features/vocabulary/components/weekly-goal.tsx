import { cn } from "@/lib/utils"

type WeeklyGoalProps = { daysThisWeek: number; goal: number }

/** Days studied this week against a gentle goal. Missing a day never resets anything. */
export function WeeklyGoal({ daysThisWeek, goal }: WeeklyGoalProps) {
  const isReached = daysThisWeek >= goal
  return (
    <section
      aria-label="Weekly goal"
      className="flex max-w-2xl flex-wrap items-center gap-4 rounded-card border border-border bg-background p-4"
    >
      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: goal }, (_, day) => (
          <span
            // Fixed-length decorative dots; the index is their identity.
            key={day}
            className={cn("size-3.5 rounded-full", day < daysThisWeek ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      <div className="flex flex-col">
        <p className="text-label text-foreground">
          {Math.min(daysThisWeek, goal)}/{goal} days this week
        </p>
        <p
          className={cn(
            "text-caption",
            isReached ? "text-success-emphasis" : "text-muted-foreground",
          )}
        >
          {isReached ? "Weekly goal reached!" : "Any day counts. Pick up whenever you like."}
        </p>
      </div>
    </section>
  )
}
