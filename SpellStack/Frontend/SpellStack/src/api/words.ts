import type { Word } from "./decks"

export async function addWord(original: string, translation: string, hint: string | null, deckId: number): Promise<Word> {
    const response = await fetch("http://localhost:5084/api/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translation, hint, deckId })
    })
    if (!response.ok) throw new Error("Kunne ikke legge til ord")
    return response.json()
}

export async function updateWord(id: number, original: string, translation: string, hint: string | null, deckId: number): Promise<Word> {
    const response = await fetch(`http://localhost:5084/api/word/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translation, hint, deckId })
    })
    if (!response.ok) throw new Error("Kunne ikke oppdatere ord")
    return response.json()
}

export async function deleteWord(id: number): Promise<void> {
    const response = await fetch(`http://localhost:5084/api/word/${id}`, {
        method: "DELETE"
    })
    if (!response.ok) throw new Error("Kunne ikke slette ord")
}