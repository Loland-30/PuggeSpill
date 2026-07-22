import { API_URL } from "./config"
import { authHeaders } from "./auth"

export interface Deck {
    id: number
    name: string
    language: string
    translationLanguage: string
    learningLanguage: string
    description: string
    highScore: number
    contentRevision: number
    trialResultRevision: number | null
    bestTrialStars: number
    createdAt: string
    words: Word[]
}

export interface Word {
    id: number
    original: string
    translation: string
    alternativeOriginal: string | null
    alternativeTranslation: string | null
    hint: string | null
    deckId: number
}

export interface HighScoreResult {
    highScore: number
    isNewHighScore: boolean
}

export interface DeckContentWordInput {
    id?: number
    original: string
    translation: string
    alternativeOriginal: string | null
    alternativeTranslation: string | null
    hint: string | null
}

export interface UpdateDeckContentInput {
    name: string
    language: string
    translationLanguage: string
    learningLanguage: string
    description: string
    words: DeckContentWordInput[]
}

export interface TrialStarRequirement {
    stars: number
    thresholdPercent: number
    requiredCorrect: number
}

export interface TrialResult {
    correctAnswers: number
    totalQuestions: number
    percentage: number
    earnedStars: number
    bestStars: number
    contentRevision: number
    trialResultRevision: number | null
    isTrialCompleted: boolean
    requirements: TrialStarRequirement[]
}

export function getDeckTrialStars(deck: Pick<Deck, "contentRevision" | "trialResultRevision" | "bestTrialStars">) {
    return Number.isInteger(deck.contentRevision) &&
        typeof deck.trialResultRevision === "number" &&
        Number.isInteger(deck.trialResultRevision) &&
        deck.trialResultRevision === deck.contentRevision
        ? Math.min(3, Math.max(0, Math.trunc(deck.bestTrialStars)))
        : 0
}

export async function createDeck(name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetch(`${API_URL}/deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })
    if (!response.ok) throw new Error("Kunne ikke opprette deck")
    return response.json()
}

export async function getDecks(): Promise<Deck[]> {
    const response = await fetch(`${API_URL}/deck`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente decks")
    return response.json()
}

export async function getDeck(id: number): Promise<Deck> {
    const response = await fetch(`${API_URL}/deck/${id}`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente deck")
    return response.json()
}

export async function updateDeck(id: number, name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetch(`${API_URL}/deck/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere deck")
    return response.json()
}

export async function updateDeckContent(id: number, input: UpdateDeckContentInput): Promise<Deck> {
    const response = await fetch(`${API_URL}/deck/${id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(input)
    })
    if (!response.ok) {
        const message = (await response.text()).trim()
        throw new Error(message || "Could not save deck content")
    }
    return response.json()
}

export async function submitTrialResult(id: number, correctAnswers: number, totalQuestions: number): Promise<TrialResult> {
    const response = await fetch(`${API_URL}/deck/${id}/trial-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ correctAnswers, totalQuestions })
    })
    if (!response.ok) {
        const message = (await response.text()).trim()
        throw new Error(message || "Could not save Trial result")
    }
    return response.json()
}

export async function deleteDeck(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/deck/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke slette deck")
}

export async function updateHighScore(id: number, score: number): Promise<HighScoreResult> {
    const response = await fetch(`${API_URL}/deck/${id}/highscore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ score })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere high score")
    return response.json()
}
