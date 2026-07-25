import { API_URL } from "./config"
import type { Word } from "./decks"
import { authHeaders } from "./auth"
import type { AchievementUnlock } from "./achievements"

export type GameDirection = "original" | "translation" | "mixed"
export type ResolvedDirection = "original" | "translation"

export type GameModifier = "normal" | "zen" | "extraHeart" | "hardcore" | "momentum" | "hidden" | "noTime"
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
    rushHoursTriggered: number
    rushHoursCompleted: number
    longestRushHourDurationSeconds: number | null
    resultSaved: boolean
    modifiersJson: string
}

export interface AnswerResponse {
    correct: boolean
    session: GameSession
    gameOver: boolean
    gameComplete: boolean
    newlyUnlockedAchievements?: AchievementUnlock[]
}

export interface MultiplayerAnswerContext {
    raceId: string
    answerSequence: number
    enemyDefeated: boolean
}

export interface EndGameResponse {
    highScore: number
    isNewHighScore: boolean
    newlyUnlockedAchievements?: AchievementUnlock[]
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
    rushHoursTriggered: number
    rushHoursCompleted: number
    longestRushHourDurationSeconds: number | null
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
    const response = await fetch(`${API_URL}/game/start/${deckId}`, {
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
    responseTimeSeconds?: number,
    rushHourElapsedSeconds?: number,
    multiplayer?: MultiplayerAnswerContext
): Promise<AnswerResponse> {
    const response = await fetch(`${API_URL}/game/answer/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
            answer,
            direction,
            timeLeft,
            modifiers,
            responseTimeSeconds,
            rushHourElapsedSeconds,
            multiplayerRaceId: multiplayer?.raceId,
            multiplayerAnswerSequence: multiplayer?.answerSequence,
            enemyDefeated: multiplayer?.enemyDefeated
        })
    })

    if (!response.ok) throw new Error("Failed to fetch word")

    return response.json()
}

export async function recordRushHourStart(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/game/rush-hour/${id}/start`, {
        method: "POST",
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Failed to record rush hour start")
}

export async function completeRushHour(
    id: number,
    bonusScore: number,
    durationSeconds?: number
): Promise<GameSession> {
    const response = await fetch(`${API_URL}/game/rush-hour/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ bonusScore, durationSeconds })
    })

    if (!response.ok) throw new Error("Failed to complete rush hour")

    return response.json()
}

export async function getGameHistory(language?: string, limit = 10): Promise<GameRunHistory[]> {
    const params = new URLSearchParams()

    if (language) params.set("language", language)
    params.set("limit", limit.toString())

    const response = await fetch(`${API_URL}/game/history?${params.toString()}`, {
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Failed to fetch game history")

    return response.json()
}

export async function endGame(id: number): Promise<EndGameResponse> {
    const response = await fetch(`${API_URL}/game/end/${id}`, {
        method: "POST",
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Failed to end game")

    return response.json()
}
