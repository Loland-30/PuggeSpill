import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"

import { getStoredToken } from "../api/auth"
import { API_ORIGIN } from "../api/config"
import type { MultiplayerRoom } from "./multiplayerTypes"

type ReconnectHandlers = {
    onRoomRejoined: (room: MultiplayerRoom) => void
    onRejoinFailed: (message: string) => void
}

export const roomNoLongerExistsMessage = "The room no longer exists."

let connection: HubConnection | null = null
let startPromise: Promise<HubConnection> | null = null
let activeRoomCode: string | null = null
let reconnectHandlers: ReconnectHandlers | null = null
let reconnectJoinPromise: Promise<void> | null = null

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return "Could not connect to the multiplayer room. Please try again."
}

function createConnection() {
    const nextConnection = new HubConnectionBuilder()
        .withUrl(`${API_ORIGIN}/hubs/multiplayer`, {
            accessTokenFactory: () => getStoredToken() ?? "",
            withCredentials: false
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

    nextConnection.onreconnected(() => {
        void rejoinActiveRoom()
    })

    return nextConnection
}

export function getMultiplayerConnection() {
    if (!connection) {
        connection = createConnection()
    }

    return connection
}

export async function startMultiplayerConnection() {
    const activeConnection = getMultiplayerConnection()

    if (activeConnection.state === HubConnectionState.Connected) {
        return activeConnection
    }

    if (startPromise) {
        return startPromise
    }

    startPromise = activeConnection
        .start()
        .then(() => activeConnection)
        .finally(() => {
            startPromise = null
        })

    return startPromise
}

export function setActiveMultiplayerRoomCode(roomCode: string | null) {
    activeRoomCode = roomCode
}

export function setMultiplayerReconnectHandlers(handlers: ReconnectHandlers | null) {
    reconnectHandlers = handlers
}

export async function leaveActiveMultiplayerRoom() {
    const activeConnection = getMultiplayerConnection()
    if (activeConnection.state === HubConnectionState.Connected) {
        await activeConnection.invoke("LeaveRoom").catch(() => undefined)
    }

    activeRoomCode = null
}

export async function stopMultiplayerConnection() {
    const activeConnection = connection
    activeRoomCode = null
    reconnectHandlers = null
    reconnectJoinPromise = null
    startPromise = null

    if (!activeConnection) return

    if (activeConnection.state === HubConnectionState.Connected) {
        await activeConnection.invoke("LeaveRoom").catch(() => undefined)
    }

    await activeConnection.stop().catch(() => undefined)
    connection = null
}

async function rejoinActiveRoom() {
    const roomCode = activeRoomCode
    if (!roomCode || reconnectJoinPromise) return reconnectJoinPromise

    reconnectJoinPromise = getMultiplayerConnection()
        .invoke<MultiplayerRoom>("JoinRoom", roomCode)
        .then(room => {
            activeRoomCode = room.code
            reconnectHandlers?.onRoomRejoined(room)
        })
        .catch(error => {
            activeRoomCode = null
            const message = getErrorMessage(error).toLowerCase().includes("room not found")
                ? roomNoLongerExistsMessage
                : getErrorMessage(error)
            reconnectHandlers?.onRejoinFailed(message)
        })
        .finally(() => {
            reconnectJoinPromise = null
        })

    return reconnectJoinPromise
}
