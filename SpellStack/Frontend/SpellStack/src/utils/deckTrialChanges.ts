import type { Deck, DeckContentWordInput } from "../api/decks"

export interface DeckTrialDraft {
    language: string
    translationLanguage: string
    learningLanguage: string
    words: DeckContentWordInput[]
}

function normalize(value: string | null | undefined) {
    return value?.trim() ?? ""
}

export function hasTrialRelevantDeckChanges(deck: Deck, draft: DeckTrialDraft) {
    if (
        normalize(deck.language) !== normalize(draft.language) ||
        normalize(deck.translationLanguage) !== normalize(draft.translationLanguage) ||
        normalize(deck.learningLanguage) !== normalize(draft.learningLanguage) ||
        deck.words.length !== draft.words.length
    ) {
        return true
    }

    const persistedWords = new Map(deck.words.map(word => [word.id, word]))

    return draft.words.some(word => {
        if (!word.id) return true
        const persisted = persistedWords.get(word.id)
        if (!persisted) return true

        return normalize(persisted.original) !== normalize(word.original) ||
            normalize(persisted.translation) !== normalize(word.translation) ||
            normalize(persisted.alternativeOriginal) !== normalize(word.alternativeOriginal) ||
            normalize(persisted.alternativeTranslation) !== normalize(word.alternativeTranslation) ||
            normalize(persisted.hint) !== normalize(word.hint)
    })
}
