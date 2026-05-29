import { API_URL } from "./config"
import { authHeaders } from "./auth"
import { fetchWithTimeout } from "./http"

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

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (!response.ok) throw new Error((await response.text()) || fallbackMessage)
    return response.json()
}

export async function createDeck(name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetchWithTimeout(`${API_URL}/deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })

    return parseResponse<Deck>(response, "Could not create deck")
}

export async function getDecks(): Promise<Deck[]> {
    const response = await fetchWithTimeout(`${API_URL}/deck`, {
        headers: await authHeaders()
    })

    return parseResponse<Deck[]>(response, "Could not load decks")
}

export async function getDeck(id: number): Promise<Deck> {
    const response = await fetchWithTimeout(`${API_URL}/deck/${id}`, {
        headers: await authHeaders()
    })

    return parseResponse<Deck>(response, "Could not load deck")
}

export async function updateDeck(id: number, name: string, language: string, translationLanguage: string, learningLanguage: string, description: string): Promise<Deck> {
    const response = await fetchWithTimeout(`${API_URL}/deck/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ name, language, translationLanguage, learningLanguage, description })
    })

    return parseResponse<Deck>(response, "Could not update deck")
}

export async function deleteDeck(id: number): Promise<void> {
    const response = await fetchWithTimeout(`${API_URL}/deck/${id}`, {
        method: "DELETE",
        headers: await authHeaders()
    })

    if (!response.ok) throw new Error((await response.text()) || "Could not delete deck")
}

export async function updateHighScore(id: number, score: number): Promise<HighScoreResult> {
    const response = await fetchWithTimeout(`${API_URL}/deck/${id}/highscore`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ score })
    })

    return parseResponse<HighScoreResult>(response, "Could not update high score")
}
