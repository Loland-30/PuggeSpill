import { API_URL } from "./config"
import type { Word } from "./decks"
import { authHeaders } from "./auth"
import { fetchWithTimeout } from "./http"

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

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (!response.ok) throw new Error((await response.text()) || fallbackMessage)
    return response.json()
}

export async function startGame(deckId: number, modifiers: ActiveGameModifier[] = [], roundLimit: RoundLimit = 25): Promise<GameSession> {
    const response = await fetchWithTimeout(`${API_URL}/game/start/${deckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ modifiers, roundLimit })
    })

    return parseResponse<GameSession>(response, "Failed to start game")
}

export async function answerWord(
    id: number,
    answer: string,
    direction: ResolvedDirection,
    timeLeft: number,
    modifiers: ActiveGameModifier[] = [],
    protectLife = false
): Promise<AnswerResponse> {
    const response = await fetchWithTimeout(`${API_URL}/game/answer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ answer, direction, timeLeft, modifiers, protectLife })
    })

    return parseResponse<AnswerResponse>(response, "Failed to submit answer")
}

export async function completeRushHour(id: number, bonusScore: number): Promise<GameSession> {
    const response = await fetchWithTimeout(`${API_URL}/game/rush-hour/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ bonusScore })
    })

    return parseResponse<GameSession>(response, "Failed to complete rush hour")
}

export async function getGameHistory(language?: string, limit = 10): Promise<GameRunHistory[]> {
    const params = new URLSearchParams()

    if (language) params.set("language", language)
    params.set("limit", limit.toString())

    const response = await fetchWithTimeout(`${API_URL}/game/history?${params.toString()}`, {
        headers: await authHeaders()
    })

    return parseResponse<GameRunHistory[]>(response, "Failed to load game history")
}

export async function endGame(id: number) {
    const response = await fetchWithTimeout(`${API_URL}/game/end/${id}`, {
        method: "POST",
        headers: await authHeaders()
    })

    return parseResponse<{ highScore: number; isNewHighScore: boolean }>(response, "Failed to end game")
}
