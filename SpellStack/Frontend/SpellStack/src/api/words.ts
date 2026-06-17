import { API_URL } from "./config"
import { authHeaders } from "./auth"
import type { Word } from "./decks"

export async function addWord(original: string, translation: string, hint: string | null, deckId: number, alternativeTranslation: string | null = null, alternativeOriginal: string | null = null): Promise<Word> {
    const response = await fetch(`${API_URL}/word`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ original, translation, alternativeOriginal, alternativeTranslation, hint, deckId })
    })
    if (!response.ok) throw new Error("Kunne ikke legge til ord")
    return response.json()
}

export async function updateWord(id: number, original: string, translation: string, hint: string | null, deckId: number, alternativeTranslation: string | null = null, alternativeOriginal: string | null = null): Promise<Word> {
    const response = await fetch(`${API_URL}/word/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ original, translation, alternativeOriginal, alternativeTranslation, hint, deckId })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere ord")
    return response.json()
}

export async function deleteWord(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/word/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke slette ord")
}
