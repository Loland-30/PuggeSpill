import type { ActiveGameModifier, GameDirection } from "../api/gameSession"

export type MultiplayerRoomPhase = "lobby" | "starting" | "racing" | "finished"

export interface MultiplayerPlayer {
    userId: string
    username: string
    profileImageUrl: string | null
    countryCode: string | null
    isOwner: boolean
    isConnected: boolean
    selectedDeckId: number | null
    selectedDeckName: string | null
    deckWordCount: number | null
    deckLanguage: string | null
    direction: GameDirection | null
    modifiers: ActiveGameModifier[]
    isReady: boolean
    readyForSettingsVersion: number | null
    raceScore: number
    scoreSequence: number
    lastAnswerSequence: number
    isFinished: boolean
    finishedAtUtc: string | null
    placement: number | null
    isDnf: boolean
    finalAccuracy: number
    bestStreak: number
    kills: number
    rushHoursTriggered: number
    hasReturnedToLobby: boolean
}

export type MultiplayerGameModeId = "race"
export type MultiplayerRaceScoreCap = 10000 | 50000 | 100000 | 200000

export interface MultiplayerRoomSettings {
    gameModeId: MultiplayerGameModeId
    scoreCap: MultiplayerRaceScoreCap
    settingsVersion: number
}

export interface MultiplayerRace {
    raceId: string
    scoreCap: number
    startsAtUtc: string
    startedAtUtc: string | null
    winnerUserId: string | null
    finishedAtUtc: string | null
}

export interface MultiplayerRoom {
    code: string
    ownerUserId: string
    maxPlayers: number
    phase: MultiplayerRoomPhase
    players: MultiplayerPlayer[]
    settings: MultiplayerRoomSettings
    race: MultiplayerRace | null
}

export interface MultiplayerRaceLeaderboardPlayer {
    userId: string
    raceScore: number
    scoreSequence: number
    lastAnswerSequence: number
    isFinished: boolean
    finishedAtUtc: string | null
    placement: number | null
    isDnf: boolean
    finalAccuracy: number
    bestStreak: number
    kills: number
    rushHoursTriggered: number
}

export interface MultiplayerRaceUpdate {
    roomCode: string
    phase: MultiplayerRoomPhase
    race: MultiplayerRace
    players: MultiplayerRaceLeaderboardPlayer[]
}
