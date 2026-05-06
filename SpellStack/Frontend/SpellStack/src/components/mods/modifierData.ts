import type { ActiveGameModifier } from "../../api/gameSession"

export type ModifierCategory = "easier" | "harder"

export interface ModifierDefinition {
    id: ActiveGameModifier
    name: string
    category: ModifierCategory
    icon: string
    shortDescription: string
    longDescription: string
    scoreMultiplier: number
}

export const MODIFIER_DEFINITIONS: ModifierDefinition[] = [
    {
        id: "extraHeart" as ActiveGameModifier,
        name: "Extra Heart",
        category: "easier",
        icon: "+1",
        shortDescription: "Start with one extra heart",
        longDescription: "Gives you more room for mistakes, but lowers your score multiplier.",
        scoreMultiplier: 0.75
    },
    {
        id: "extraTime" as ActiveGameModifier,
        name: "Extra Time",
        category: "easier",
        icon: "+T",
        shortDescription: "More time to answer",
        longDescription: "Increases your answer timer, but lowers your score multiplier.",
        scoreMultiplier: 0.85
    },
    {
        id: "zen" as ActiveGameModifier,
        name: "Zen",
        category: "easier",
        icon: "∞",
        shortDescription: "No timer, no lives, no score",
        longDescription: "Practice freely without pressure. Score is disabled.",
        scoreMultiplier: 0
    },
    {
        id: "hardcore" as ActiveGameModifier,
        name: "Hardcore",
        category: "harder",
        icon: "1",
        shortDescription: "One heart, less time",
        longDescription: "You only get one heart and less time to answer, but earn a higher score multiplier.",
        scoreMultiplier: 1.5
    },
    {
        id: "momentum" as ActiveGameModifier,
        name: "Momentum",
        category: "harder",
        icon: ">",
        shortDescription: "Timer only refills by 4s",
        longDescription: "Correct answers only restore a small amount of time instead of fully resetting the timer.",
        scoreMultiplier: 1.25
    },
    {
        id: "bossRush" as ActiveGameModifier,
        name: "Boss Rush",
        category: "harder",
        icon: "B",
        shortDescription: "Only boss encounters",
        longDescription: "Fight only boss-style enemies that require multiple correct answers to defeat.",
        scoreMultiplier: 1.75
    }
]