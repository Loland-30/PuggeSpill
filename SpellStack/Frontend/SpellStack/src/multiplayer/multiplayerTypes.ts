export interface MultiplayerPlayer {
    userId: string
    username: string
    profileImageUrl: string | null
    countryCode: string | null
    isOwner: boolean
}

export type MultiplayerGameModeId = "race"
export type MultiplayerRaceScoreCap = 10000 | 50000 | 100000 | 200000

export interface MultiplayerRoomSettings {
    gameModeId: MultiplayerGameModeId
    scoreCap: MultiplayerRaceScoreCap
    settingsVersion: number
}

export interface MultiplayerRoom {
    code: string
    ownerUserId: string
    maxPlayers: number
    players: MultiplayerPlayer[]
    settings: MultiplayerRoomSettings
}
