import { authHeaders } from "./auth"

export interface Deck {
    id: number
    name: string
    language: string
    translationLanguage: string
    learningLanguage: string
    description: string
    highScore: number
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

export async function createDeck(name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetch("http://localhost:5084/api/deck", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })
    if (!response.ok) throw new Error("Kunne ikke opprette deck")
    return response.json()
}

export async function getDecks(): Promise<Deck[]> {
    const response = await fetch("http://localhost:5084/api/deck", {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente decks")
    return response.json()
}

export async function getDeck(id: number): Promise<Deck> {
    const response = await fetch(`http://localhost:5084/api/deck/${id}`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente deck")
    return response.json()
}

export async function updateDeck(id: number, name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetch(`http://localhost:5084/api/deck/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere deck")
    return response.json()
}

export async function deleteDeck(id: number): Promise<void> {
    const response = await fetch(`http://localhost:5084/api/deck/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke slette deck")
}

export async function updateHighScore(id: number, score: number): Promise<HighScoreResult> {
    const response = await fetch(`http://localhost:5084/api/deck/${id}/highscore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ score })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere high score")
    return response.json()
}
