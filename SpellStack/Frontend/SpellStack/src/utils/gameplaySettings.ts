import type { Deck } from "../api/decks"
import type { GameDirection, RoundLimit } from "../api/gameSession"

export const gameplaySettingsStorageKey = "spellstack_gameplay_settings"

export type DefaultRoundLength = "10" | "25" | "50" | "endless"
export type DefaultGameDirection = "known-to-learning" | "learning-to-known" | "mixed"
export type WrongAnswerRevealDuration = "short" | "normal" | "long"
export type AccentHandling = "strict" | "forgiving"

export interface StoredGameplaySettings {
    defaultRoundLength?: DefaultRoundLength
    defaultGameDirection?: DefaultGameDirection
    wrongAnswerRevealDuration?: WrongAnswerRevealDuration
    autoFocusAnswerInput?: boolean
    rushHourAutoSubmit?: boolean
    accentHandling?: AccentHandling
}

export interface GameplaySettings {
    defaultRoundLength: DefaultRoundLength
    defaultGameDirection: DefaultGameDirection
    wrongAnswerRevealDuration: WrongAnswerRevealDuration
    autoFocusAnswerInput: boolean
    rushHourAutoSubmit: boolean
    accentHandling: AccentHandling
}

export const fallbackGameplaySettings: GameplaySettings = {
    defaultRoundLength: "25",
    defaultGameDirection: "known-to-learning",
    wrongAnswerRevealDuration: "normal",
    autoFocusAnswerInput: true,
    rushHourAutoSubmit: true,
    accentHandling: "forgiving"
}

export function readGameplaySettings(): GameplaySettings {
    try {
        const stored = JSON.parse(localStorage.getItem(gameplaySettingsStorageKey) ?? "{}") as StoredGameplaySettings
        return {
            ...fallbackGameplaySettings,
            ...stored
        }
    } catch {
        return fallbackGameplaySettings
    }
}

export function saveGameplaySettings(settings: GameplaySettings) {
    localStorage.setItem(gameplaySettingsStorageKey, JSON.stringify(settings))
}

export function toRoundLimit(roundLength: DefaultRoundLength): RoundLimit {
    if (roundLength === "endless") return null
    return Number(roundLength) as RoundLimit
}

export function resolveDefaultGameDirection(deck: Deck, defaultDirection: DefaultGameDirection): GameDirection {
    if (defaultDirection === "mixed") return "mixed"

    const learningIsOriginal = deck.learningLanguage === deck.language
    const knownToLearningDirection: GameDirection = learningIsOriginal ? "translation" : "original"
    const learningToKnownDirection: GameDirection = learningIsOriginal ? "original" : "translation"

    return defaultDirection === "known-to-learning"
        ? knownToLearningDirection
        : learningToKnownDirection
}
