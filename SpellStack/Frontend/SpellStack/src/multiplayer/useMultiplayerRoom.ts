import { useCallback, useEffect, useState } from "react"

import {
    getMultiplayerConnection,
    leaveActiveMultiplayerRoom,
    roomNoLongerExistsMessage,
    setActiveMultiplayerRoomCode,
    setMultiplayerReconnectHandlers,
    startMultiplayerConnection
} from "./multiplayerConnection"
import type { MultiplayerRoom } from "./multiplayerTypes"

type MultiplayerStatus = "idle" | "connecting" | "connected"

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
    const [status, setStatus] = useState<MultiplayerStatus>("idle")
    const [error, setError] = useState<string | null>(null)
    const [isBusy, setIsBusy] = useState(false)

    useEffect(() => {
        const connection = getMultiplayerConnection()

        const handleRoomUpdated = (updatedRoom: MultiplayerRoom) => {
            setActiveMultiplayerRoomCode(updatedRoom.code)
            setRoom(updatedRoom)
            setStatus("connected")
        }

        const handleRejoinFailed = (message: string) => {
            setActiveMultiplayerRoomCode(null)
            setRoom(null)
            setStatus("idle")
            setError(message)
        }

        connection.on("RoomUpdated", handleRoomUpdated)
        setMultiplayerReconnectHandlers({
            onRoomRejoined: handleRoomUpdated,
            onRejoinFailed: handleRejoinFailed
        })

        return () => {
            connection.off("RoomUpdated", handleRoomUpdated)
            setMultiplayerReconnectHandlers(null)
        }
    }, [])

    const createRoom = useCallback(async () => {
        setIsBusy(true)
        setError(null)
        setStatus("connecting")

        try {
            const connection = await startMultiplayerConnection()
            const createdRoom = await connection.invoke<MultiplayerRoom>("CreateRoom")
            setActiveMultiplayerRoomCode(createdRoom.code)
            setRoom(createdRoom)
            setStatus("connected")
            return createdRoom
        }
        catch (createError) {
            setActiveMultiplayerRoomCode(null)
            setStatus("idle")
            const message = normalizeRoomError(createError)
            setError(message)
            throw new Error(message)
        }
        finally {
            setIsBusy(false)
        }
    }, [])

    const joinRoom = useCallback(async (roomCode: string) => {
        setIsBusy(true)
        setError(null)
        setStatus("connecting")

        try {
            const connection = await startMultiplayerConnection()
            const joinedRoom = await connection.invoke<MultiplayerRoom>("JoinRoom", roomCode.trim().toUpperCase())
            setActiveMultiplayerRoomCode(joinedRoom.code)
            setRoom(joinedRoom)
            setStatus("connected")
            return joinedRoom
        }
        catch (joinError) {
            setActiveMultiplayerRoomCode(null)
            setRoom(null)
            setStatus("idle")
            const message = normalizeRoomError(joinError)
            setError(message)
            throw new Error(message)
        }
        finally {
            setIsBusy(false)
        }
    }, [])

    const leaveRoom = useCallback(async () => {
        await leaveActiveMultiplayerRoom()
        setRoom(null)
        setStatus("idle")
    }, [])

    const clearError = useCallback(() => setError(null), [])

    return {
        room,
        status,
        error,
        isBusy,
        createRoom,
        joinRoom,
        leaveRoom,
        clearError
    }
}
