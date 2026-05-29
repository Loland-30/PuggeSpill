import type { ActiveGameModifier, GameDirection, RoundLimit } from "../api/gameSession"

export type RootStackParamList = {
    MainTabs: undefined
    DeckEditor: { deckId?: number } | undefined
    Play: {
        deckId: number
        deckName?: string
        direction?: GameDirection
        modifiers?: ActiveGameModifier[]
        roundLimit?: RoundLimit
    }
    TrialPlay: { trialId: string }
    Theme: undefined
}

export type MainTabParamList = {
    Decks: undefined
    Trials: undefined
    Profile: undefined
    Settings: undefined
}
