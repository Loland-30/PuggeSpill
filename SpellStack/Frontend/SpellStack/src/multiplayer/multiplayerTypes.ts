export interface MultiplayerPlayer {
    userId: string
    username: string
    profileImageUrl: string | null
    isOwner: boolean
}

export interface MultiplayerRoom {
    code: string
    ownerUserId: string
    maxPlayers: number
    players: MultiplayerPlayer[]
}
