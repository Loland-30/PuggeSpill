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
        id: "extraHeart",
        name: "Extra Heart",
        category: "easier",
        icon: "heart",
        shortDescription: "Start with one extra heart.",
        longDescription: "Gives you more room for mistakes, but lowers your score multiplier.",
        scoreMultiplier: 0.75
    },
    {
        id: "zen",
        name: "Zen",
        category: "easier",
        icon: "leaf",
        shortDescription: "No timer, no lives, no score.",
        longDescription: "Practice freely without pressure. Score is disabled.",
        scoreMultiplier: 0
    },
    {
        id: "hardcore",
        name: "Hardcore",
        category: "harder",
        icon: "shield",
        shortDescription: "One heart, higher score pressure.",
        longDescription: "You only get one heart and less time to answer, but earn a higher score multiplier.",
        scoreMultiplier: 1.5
    },
    {
        id: "momentum",
        name: "Momentum",
        category: "harder",
        icon: "zap",
        shortDescription: "Build stacks that make time drain faster.",
        longDescription: "Gain a Momentum stack every 5 correct answers. Each stack makes time drain faster and increases points earned. Losing a life removes all stacks.",
        scoreMultiplier: 1.25
    },
    {
        id: "hidden",
        name: "Hidden",
        category: "harder",
        icon: "eye-off",
        shortDescription: "The question fades after a short delay.",
        longDescription: "The question fades after a short delay. Answer from memory.",
        scoreMultiplier: 1.3
    },
    {
        id: "noTime",
        name: "No Time",
        category: "harder",
        icon: "clock-off",
        shortDescription: "The timer is hidden, but time still runs.",
        longDescription: "The timer is hidden, but time still runs. Running out of time costs a life.",
        scoreMultiplier: 1.35
    }
]
