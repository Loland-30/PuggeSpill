import type { Word } from "./decks"
import { authHeaders } from "./auth"

export type GameDirection = "original" | "translation" | "mixed"
export type ResolvedDirection = "original" | "translation"

export type GameModifier = "normal" | "zen" | "extraHeart" | "hardcore" | "momentum"
export type ActiveGameModifier = Exclude<GameModifier, "normal">

export type RoundLimit = 10 | 25 | 50 | 100 | null

export interface GameSession {
    id: number
    userId: number
    deckId: number
    currentWordId: number
    currentWord: Word
    streakCount: number
    finalScore: number
    lives: number
    isActive: boolean
    roundLimit: RoundLimit
    questionsAnswered: number
    correctAnswers: number
    wrongAnswers: number
    bestStreak: number
    totalResponseTimeSeconds: number | null
    resultSaved: boolean
    modifiersJson: string
}

export interface AnswerResponse {
    correct: boolean
    session: GameSession
    gameOver: boolean
    gameComplete: boolean
}

export interface GameRunHistory {
    id: number
    deckId: number
    deckName: string
    gameSessionId: number | null
    languageCode: string
    finalScore: number
    correctAnswers: number
    wrongAnswers: number
    totalAnswers: number
    accuracyPercent: number
    bestStreak: number
    highestCombo: number
    averageResponseTimeSeconds: number | null
    roundLimit: RoundLimit
    completedAt: string
    endReason: string
    modifiersJson: string
}

export async function startGame(
    deckId: number,
    modifiers: ActiveGameModifier[] = [],
    roundLimit: RoundLimit = 25
): Promise<GameSession> {
    const response = await fetch(`http://localhost:5084/api/game/start/${deckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ modifiers, roundLimit })
    })

    if (!response.ok) throw new Error("Failed to start game!")

    return response.json()
}

export async function answerWord(
    id: number,
    answer: string,
    direction: ResolvedDirection,
    timeLeft: number,
    modifiers: ActiveGameModifier[] = [],
    protectLife = false
): Promise<AnswerResponse> {
    const response = await fetch(`http://localhost:5084/api/game/answer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ answer, direction, timeLeft, modifiers, protectLife })
    })

    if (!response.ok) throw new Error("Failed to fetch word")

    return response.json()
}

export async function completeRushHour(id: number, bonusScore: number): Promise<GameSession> {
    const response = await fetch(`http://localhost:5084/api/game/rush-hour/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ bonusScore })
    })

    if (!response.ok) throw new Error("Failed to complete rush hour")

    return response.json()
}

export async function getGameHistory(language?: string, limit = 10): Promise<GameRunHistory[]> {
    const params = new URLSearchParams()

    if (language) params.set("language", language)
    params.set("limit", limit.toString())

    const response = await fetch(`http://localhost:5084/api/game/history?${params.toString()}`, {
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Failed to fetch game history")

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