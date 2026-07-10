import { useCallback, useEffect, useRef, useState } from "react"

import { getMultiplayerConnection, startMultiplayerConnection } from "./multiplayerConnection"
import type { MultiplayerRoom } from "./multiplayerTypes"

type MultiplayerStatus = "idle" | "connecting" | "connected"

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return "Could not connect to the multiplayer room. Please try again."
}

export function useMultiplayerRoom() {
    const [room, setRoom] = useState<MultiplayerRoom | null>(null)
    const [status, setStatus] = useState<MultiplayerStatus>("idle")
    const [error, setError] = useState<string | null>(null)
    const [isBusy, setIsBusy] = useState(false)
    const roomCodeRef = useRef<string | null>(null)

    useEffect(() => {
        const connection = getMultiplayerConnection()

        const handleRoomUpdated = (updatedRoom: MultiplayerRoom) => {
            roomCodeRef.current = updatedRoom.code
            setRoom(updatedRoom)
            setStatus("connected")
        }

        connection.on("RoomUpdated", handleRoomUpdated)
        connection.onreconnected(async () => {
            const roomCode = roomCodeRef.current
            if (!roomCode) return

            try {
                const updatedRoom = await connection.invoke<MultiplayerRoom>("JoinRoom", roomCode)
                handleRoomUpdated(updatedRoom)
            }
            catch (reconnectError) {
                setError(getErrorMessage(reconnectError))
            }
        })

        return () => {
            connection.off("RoomUpdated", handleRoomUpdated)
        }
    }, [])

    const createRoom = useCallback(async () => {
        setIsBusy(true)
        setError(null)
        setStatus("connecting")

        try {
            const connection = await startMultiplayerConnection()
            const createdRoom = await connection.invoke<MultiplayerRoom>("CreateRoom")
            roomCodeRef.current = createdRoom.code
            setRoom(createdRoom)
            setStatus("connected")
            return createdRoom
        }
        catch (createError) {
            setStatus("idle")
            const message = getErrorMessage(createError)
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
            roomCodeRef.current = joinedRoom.code
            setRoom(joinedRoom)
            setStatus("connected")
            return joinedRoom
        }
        catch (joinError) {
            setStatus(roomCodeRef.current ? "connected" : "idle")
            const message = getErrorMessage(joinError)
            setError(message)
            throw new Error(message)
        }
        finally {
            setIsBusy(false)
        }
    }, [])

    const leaveRoom = useCallback(async () => {
        const connection = getMultiplayerConnection()
        if (connection.state === "Connected") {
            await connection.invoke("LeaveRoom").catch(() => undefined)
        }

        roomCodeRef.current = null
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
