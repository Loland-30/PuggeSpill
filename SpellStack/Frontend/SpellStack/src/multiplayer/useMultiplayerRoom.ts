import { useCallback, useEffect, useState } from "react"

import {
    getMultiplayerConnection,
    getMultiplayerConnectionStatus,
    leaveActiveMultiplayerRoom,
    roomNoLongerExistsMessage,
    setActiveMultiplayerRoomCode,
    setMultiplayerReconnectHandlers,
    startMultiplayerConnection,
    subscribeToMultiplayerConnectionStatus,
    type MultiplayerConnectionStatus
} from "./multiplayerConnection"
import type { MultiplayerRoom } from "./multiplayerTypes"

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return "Could not connect to the multiplayer room. Please try again."
}

function normalizeRoomError(error: unknown) {
    const message = getErrorMessage(error)
    return message.toLowerCase().includes("room not found") ? roomNoLongerExistsMessage : message
}

export function useMultiplayerRoom() {
    const [room, setRoom] = useState<MultiplayerRoom | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<MultiplayerConnectionStatus>(getMultiplayerConnectionStatus())
    const [error, setError] = useState<string | null>(null)
    const [requestBusy, setRequestBusy] = useState(false)
    const [roomSessionInvalidationId, setRoomSessionInvalidationId] = useState(0)

    useEffect(() => subscribeToMultiplayerConnectionStatus(setConnectionStatus), [])

    useEffect(() => {
        const connection = getMultiplayerConnection()

        const handleRoomUpdated = (updatedRoom: MultiplayerRoom) => {
            setActiveMultiplayerRoomCode(updatedRoom.code)
            setRoom(updatedRoom)
            setError(null)
        }

        const invalidateActiveRoomSession = (message: string) => {
            setActiveMultiplayerRoomCode(null)
            setRoom(null)
            setError(message)
            setRoomSessionInvalidationId(id => id + 1)
        }

        connection.on("RoomUpdated", handleRoomUpdated)
        setMultiplayerReconnectHandlers({
            onRoomRejoined: handleRoomUpdated,
            onRejoinFailed: invalidateActiveRoomSession,
            onConnectionClosed: invalidateActiveRoomSession
        })

        return () => {
            connection.off("RoomUpdated", handleRoomUpdated)
            setMultiplayerReconnectHandlers(null)
        }
    }, [])

    const createRoom = useCallback(async () => {
        setRequestBusy(true)
        setError(null)

        try {
            const connection = await startMultiplayerConnection()
            const createdRoom = await connection.invoke<MultiplayerRoom>("CreateRoom")
            setActiveMultiplayerRoomCode(createdRoom.code)
            setRoom(createdRoom)
            return createdRoom
        }
        catch (createError) {
            setActiveMultiplayerRoomCode(null)
            const message = normalizeRoomError(createError)
            setError(message)
            throw new Error(message)
        }
        finally {
            setRequestBusy(false)
        }
    }, [])

    const joinRoom = useCallback(async (roomCode: string) => {
        setRequestBusy(true)
        setError(null)

        try {
            const connection = await startMultiplayerConnection()
            const joinedRoom = await connection.invoke<MultiplayerRoom>("JoinRoom", roomCode.trim().toUpperCase())
            setActiveMultiplayerRoomCode(joinedRoom.code)
            setRoom(joinedRoom)
            return joinedRoom
        }
        catch (joinError) {
            const message = normalizeRoomError(joinError)
            setError(message)
            throw new Error(message)
        }
        finally {
            setRequestBusy(false)
        }
    }, [])

    const leaveRoom = useCallback(async () => {
        await leaveActiveMultiplayerRoom()
        setRoom(null)
        setError(null)
    }, [])

    const clearError = useCallback(() => setError(null), [])
    const isConnectionBusy = connectionStatus === "connecting" || connectionStatus === "reconnecting"

    return {
        room,
        status: connectionStatus,
        error,
        isBusy: requestBusy || isConnectionBusy,
        roomSessionInvalidationId,
        createRoom,
        joinRoom,
        leaveRoom,
        clearError
    }
}
