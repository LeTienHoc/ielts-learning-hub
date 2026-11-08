import { Bean, Flower2, Leaf, Sprout, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { GardenStage } from "@/lib/learning/mastery"

import type { GardenBed } from "../types"

const STAGE: Record<GardenStage, { icon: LucideIcon; label: string; className: string }> = {
  seed: { icon: Bean, label: "seed (not introduced yet)", className: "text-muted-foreground" },
  sprout: { icon: Sprout, label: "sprout (learning)", className: "text-success" },
  plant: { icon: Leaf, label: "growing", className: "text-success" },
  bloom: { icon: Flower2, label: "in bloom (mastered)", className: "text-primary" },
}

const topicLabel = (topic: string) => topic.charAt(0).toUpperCase() + topic.slice(1)

/**
 * My words as a garden: every word is a plant that grows with its review interval and blooms
 * when mastered. Plants never wilt: a break simply leaves the garden waiting.
 */
export function WordGarden({ beds }: { beds: readonly GardenBed[] }) {
  return (
    <section aria-labelledby="word-garden-heading" className="flex flex-col gap-3">
      <h2 id="word-garden-heading" className="text-h4 text-foreground">
        Your word garden
      </h2>
      {beds.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          Your garden is waiting. Add a set and every word you learn becomes a plant.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {beds.map((bed) => (
            <div
              key={bed.topic}
              className="flex flex-col gap-2 rounded-card border border-border bg-background p-4"
            >
              <h3 className="text-label text-muted-foreground">{topicLabel(bed.topic)}</h3>
              <ul aria-label={topicLabel(bed.topic)} className="flex flex-wrap gap-2">
                {bed.plants.map((plant) => {
                  const stage = STAGE[plant.stage]
                  return (
                    <li
                      key={plant.wordSlug}
                      title={plant.lemma}
                      className="flex flex-col items-center gap-0.5 rounded-md bg-surface px-2 py-1.5"
                    >
                      <stage.icon aria-hidden="true" className={cn("size-6", stage.className)} />
                      <span
                        aria-hidden="true"
                        className="max-w-20 truncate text-caption text-muted-foreground"
                      >
                        {plant.lemma}
                      </span>
                      <span className="sr-only">
                        {plant.lemma}: {stage.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
