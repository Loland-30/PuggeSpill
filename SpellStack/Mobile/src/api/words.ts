import { API_URL } from "./config"
import type { Word } from "./decks"
import { fetchWithTimeout } from "./http"

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (!response.ok) throw new Error((await response.text()) || fallbackMessage)
    return response.json()
}

export async function getWords(deckId: number): Promise<Word[]> {
    const response = await fetchWithTimeout(`${API_URL}/word/deck/${deckId}`)
    return parseResponse<Word[]>(response, "Could not load words")
}

export async function addWord(original: string, translation: string, hint: string | null, deckId: number, alternativeTranslation: string | null = null, alternativeOriginal: string | null = null): Promise<Word> {
    const response = await fetchWithTimeout(`${API_URL}/word`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translation, alternativeOriginal, alternativeTranslation, hint, deckId })
    })

    return parseResponse<Word>(response, "Could not add word")
}

export async function updateWord(id: number, original: string, translation: string, hint: string | null, deckId: number, alternativeTranslation: string | null = null, alternativeOriginal: string | null = null): Promise<Word> {
    const response = await fetchWithTimeout(`${API_URL}/word/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translation, alternativeOriginal, alternativeTranslation, hint, deckId })
    })

    return parseResponse<Word>(response, "Could not update word")
}

export async function deleteWord(id: number): Promise<void> {
    const response = await fetchWithTimeout(`${API_URL}/word/${id}`, {
        method: "DELETE"
    })

    if (!response.ok) throw new Error((await response.text()) || "Could not delete word")
}
