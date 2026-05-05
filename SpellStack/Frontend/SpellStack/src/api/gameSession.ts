import type { Word } from "./decks"
import { authHeaders } from "./auth"

export type GameDirection = "original" | "translation" | "mixed"
export type ResolvedDirection = "original" | "translation"
export type GameModifier = "normal" | "zen" | "extraHeart" | "hardcore" | "momentum"
export type ActiveGameModifier = Exclude<GameModifier, "normal">

export interface GameSession {
    id: number
    deckId: number
    currentWordId: number
    currentWord: Word
    streakCount: number
    finalScore: number
    lives: number
    isActive: boolean
}

export interface AnswerResponse {
    correct: boolean
    session: GameSession
    gameOver: boolean
}

export async function startGame(deckId: number, modifiers: ActiveGameModifier[] = []): Promise<GameSession> {
    const response = await fetch(`http://localhost:5084/api/game/start/${deckId}`, {
        method: "POST",
        headers: { "Content-Type" : "application/json", ...authHeaders() },
        body: JSON.stringify({ modifiers })
    })
    if (!response.ok) throw new Error("Failed to start game!");
    return response.json();
}

export async function answerWord(id: number, answer: string, direction: ResolvedDirection, timeLeft: number, modifiers: ActiveGameModifier[] = [], protectLife = false): Promise<AnswerResponse> {
    const response = await fetch(`http://localhost:5084/api/game/answer/${id}`, {
        method: "POST",
        headers: { "Content-Type" : "application/json", ...authHeaders() },
        body: JSON.stringify({ answer, direction, timeLeft, modifiers, protectLife })
    })
    if (!response.ok) throw new Error("Failed to fetch word");
    return response.json();
}

export async function completeRushHour(id: number, bonusScore: number): Promise<GameSession> {
    const response = await fetch(`http://localhost:5084/api/game/rush-hour/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type" : "application/json", ...authHeaders() },
        body: JSON.stringify({ bonusScore })
    })
    if (!response.ok) throw new Error("Failed to complete rush hour")
    return response.json()
}

export async function endGame(id: number) {
    const response = await fetch(`http://localhost:5084/api/game/end/${id}`, {
        method: "POST",
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Failed to end game")
    return response.json()
}
