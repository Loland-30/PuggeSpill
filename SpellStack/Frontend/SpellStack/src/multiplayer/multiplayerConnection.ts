import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"

import { getStoredToken } from "../api/auth"
import { API_ORIGIN } from "../api/config"
import type { MultiplayerRoom } from "./multiplayerTypes"

export type MultiplayerConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting"

type ReconnectHandlers = {
    onRoomRejoined: (room: MultiplayerRoom) => void
    onRejoinFailed: (message: string) => void
    onConnectionClosed: (message: string) => void
}

export const roomNoLongerExistsMessage = "The room no longer exists."
export const connectionLostMessage = "Connection lost. Please reconnect and join the room again."
export const reconnectingMessage = "Reconnecting..."

const statusListeners = new Set<(status: MultiplayerConnectionStatus) => void>()

let connection: HubConnection | null = null
let connectionStatus: MultiplayerConnectionStatus = "disconnected"
let startPromise: Promise<HubConnection> | null = null
let activeRoomCode: string | null = null
let reconnectHandlers: ReconnectHandlers | null = null
let reconnectJoinPromise: Promise<void> | null = null
let intentionalStop = false

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return "Could not connect to the multiplayer room. Please try again."
}

function normalizeRejoinError(error: unknown) {
    const message = getErrorMessage(error)
    return message.toLowerCase().includes("room not found") ? roomNoLongerExistsMessage : message
}

function setConnectionStatus(status: MultiplayerConnectionStatus) {
    if (connectionStatus === status) return

    connectionStatus = status
    statusListeners.forEach(listener => listener(status))
}

function waitForSignalRState(targetState: HubConnectionState, timeoutMs = 5000) {
    const activeConnection = getMultiplayerConnection()

    if (activeConnection.state === targetState) {
        return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
        const startedAt = Date.now()
        const intervalId = window.setInterval(() => {
            if (activeConnection.state === targetState) {
                window.clearInterval(intervalId)
                resolve()
                return
            }

            if (Date.now() - startedAt >= timeoutMs) {
                window.clearInterval(intervalId)
                reject(new Error("Could not prepare the multiplayer connection. Please try again."))
            }
        }, 75)
    })
}

function createConnection() {
    intentionalStop = false

    const nextConnection = new HubConnectionBuilder()
        .withUrl(`${API_ORIGIN}/hubs/multiplayer`, {
            accessTokenFactory: () => getStoredToken() ?? "",
            withCredentials: false
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Warning)
        .build()

    nextConnection.onreconnecting(() => {
        setConnectionStatus("reconnecting")
    })

    nextConnection.onreconnected(() => {
        setConnectionStatus("connected")
        void rejoinActiveRoom()
    })

    nextConnection.onclose(() => {
        setConnectionStatus("disconnected")
        startPromise = null
        reconnectJoinPromise = null

        if (intentionalStop) return

        activeRoomCode = null
        reconnectHandlers?.onConnectionClosed(connectionLostMessage)
    })

    return nextConnection
}

export function getMultiplayerConnection() {
    if (!connection) {
        connection = createConnection()
    }

    return connection
}

export function getMultiplayerConnectionStatus() {
    return connectionStatus
}

export function subscribeToMultiplayerConnectionStatus(listener: (status: MultiplayerConnectionStatus) => void) {
    statusListeners.add(listener)
    listener(connectionStatus)

    return () => {
        statusListeners.delete(listener)
    }
}

export async function startMultiplayerConnection() {
    const activeConnection = getMultiplayerConnection()

    if (activeConnection.state === HubConnectionState.Connected) {
        setConnectionStatus("connected")
        return activeConnection
    }

    if (activeConnection.state === HubConnectionState.Disconnected) {
        if (startPromise) return startPromise

        setConnectionStatus("connecting")
        startPromise = activeConnection
            .start()
            .then(() => {
                setConnectionStatus("connected")
                return activeConnection
            })
            .catch(error => {
                setConnectionStatus("disconnected")
                throw error
            })
            .finally(() => {
                startPromise = null
            })

        return startPromise
    }

    if (activeConnection.state === HubConnectionState.Connecting) {
        if (startPromise) return startPromise

        setConnectionStatus("connecting")
        await waitForSignalRState(HubConnectionState.Connected)
        setConnectionStatus("connected")
        return activeConnection
    }

    if (activeConnection.state === HubConnectionState.Reconnecting) {
        setConnectionStatus("reconnecting")
        throw new Error(reconnectingMessage)
    }

    await waitForSignalRState(HubConnectionState.Disconnected)
    return startMultiplayerConnection()
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
    intentionalStop = true
    activeRoomCode = null
    reconnectHandlers = null
    reconnectJoinPromise = null
    startPromise = null

    if (!activeConnection) {
        setConnectionStatus("disconnected")
        intentionalStop = false
        return
    }

    if (activeConnection.state === HubConnectionState.Connected) {
        await activeConnection.invoke("LeaveRoom").catch(() => undefined)
    }

    await activeConnection.stop().catch(() => undefined)
    connection = null
    intentionalStop = false
    setConnectionStatus("disconnected")
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
            reconnectHandlers?.onRejoinFailed(normalizeRejoinError(error))
        })
        .finally(() => {
            reconnectJoinPromise = null
        })

    return reconnectJoinPromise
}
