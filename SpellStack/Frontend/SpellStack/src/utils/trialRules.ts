import type { TrialStarRequirement } from "../api/decks"

export const TRIAL_MINIMUM_DECK_WORD_COUNT = 10
export const TRIAL_ONE_STAR_THRESHOLD_PERCENT = 70
export const TRIAL_TWO_STAR_THRESHOLD_PERCENT = 80
export const TRIAL_MAXIMUM_STARS = 3

export function isDeckTrialEligible(wordCount: number) {
    return wordCount >= TRIAL_MINIMUM_DECK_WORD_COUNT
}

export function getTrialRequirements(totalQuestions: number): TrialStarRequirement[] {
    if (totalQuestions <= 0) return []

    return [
        {
            stars: 1,
            thresholdPercent: TRIAL_ONE_STAR_THRESHOLD_PERCENT,
            requiredCorrect: Math.ceil(totalQuestions * TRIAL_ONE_STAR_THRESHOLD_PERCENT / 100)
        },
        {
            stars: 2,
            thresholdPercent: TRIAL_TWO_STAR_THRESHOLD_PERCENT,
            requiredCorrect: Math.ceil(totalQuestions * TRIAL_TWO_STAR_THRESHOLD_PERCENT / 100)
        },
        {
            stars: TRIAL_MAXIMUM_STARS,
            thresholdPercent: 100,
            requiredCorrect: totalQuestions
        }
    ]
}
