import { useCallback, useEffect, useRef, useState } from "react"

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
import type { ActiveGameModifier, GameDirection } from "../api/gameSession"
import type {
    MultiplayerGameModeId,
    MultiplayerRaceScoreCap,
    MultiplayerRaceUpdate,
    MultiplayerRoom
} from "./multiplayerTypes"

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
    const [settingsError, setSettingsError] = useState<string | null>(null)
    const [settingsBusy, setSettingsBusy] = useState(false)
    const [roomActionBusy, setRoomActionBusy] = useState(false)
    const [roomActionError, setRoomActionError] = useState<string | null>(null)
    const [roomSessionInvalidationId, setRoomSessionInvalidationId] = useState(0)
    const settingsRequestInFlightRef = useRef(false)
    const roomActionInFlightRef = useRef(false)

    useEffect(() => subscribeToMultiplayerConnectionStatus(setConnectionStatus), [])

    useEffect(() => {
        const connection = getMultiplayerConnection()

        const handleRoomUpdated = (updatedRoom: MultiplayerRoom) => {
            setActiveMultiplayerRoomCode(updatedRoom.code)
            setRoom(updatedRoom)
            setError(null)
        }

        const handleRaceUpdated = (update: MultiplayerRaceUpdate) => {
            setRoom(currentRoom => {
                if (!currentRoom || currentRoom.code !== update.roomCode) return currentRoom

                const playerUpdates = new Map(update.players.map(player => [player.userId, player]))
                return {
                    ...currentRoom,
                    phase: update.phase,
                    race: update.race,
                    players: currentRoom.players.map(player => ({
                        ...player,
                        ...(playerUpdates.get(player.userId) ?? {})
                    }))
                }
            })
        }

        const invalidateActiveRoomSession = (message: string) => {
            setActiveMultiplayerRoomCode(null)
            setRoom(null)
            setError(message)
            setRoomSessionInvalidationId(id => id + 1)
        }

        connection.on("RoomUpdated", handleRoomUpdated)
        connection.on("RaceUpdated", handleRaceUpdated)
        setMultiplayerReconnectHandlers({
            onRoomRejoined: handleRoomUpdated,
            onRejoinFailed: invalidateActiveRoomSession,
            onConnectionClosed: invalidateActiveRoomSession
        })

        return () => {
            connection.off("RoomUpdated", handleRoomUpdated)
            connection.off("RaceUpdated", handleRaceUpdated)
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

    const runRoomAction = useCallback(async (
        methodName: "SetReady" | "SetUnready" | "StartRace" | "ReturnToLobby",
        ...args: unknown[]
    ) => {
        if (roomActionInFlightRef.current) return null

        roomActionInFlightRef.current = true
        setRoomActionBusy(true)
        setRoomActionError(null)

        try {
            const connection = await startMultiplayerConnection()
            const updatedRoom = await connection.invoke<MultiplayerRoom>(methodName, ...args)
            setRoom(updatedRoom)
            return updatedRoom
        }
        catch (actionError) {
            const message = getErrorMessage(actionError)
            setRoomActionError(message)
            throw new Error(message)
        }
        finally {
            roomActionInFlightRef.current = false
            setRoomActionBusy(false)
        }
    }, [])

    const updateRoomSettings = useCallback(async (
        gameModeId: MultiplayerGameModeId,
        scoreCap: MultiplayerRaceScoreCap
    ) => {
        if (settingsRequestInFlightRef.current) return null

        settingsRequestInFlightRef.current = true
        setSettingsBusy(true)
        setSettingsError(null)

        try {
            const connection = await startMultiplayerConnection()
            const updatedRoom = await connection.invoke<MultiplayerRoom>("UpdateRoomSettings", gameModeId, scoreCap)
            setRoom(updatedRoom)
            return updatedRoom
        }
        catch (updateError) {
            const message = getErrorMessage(updateError)
            setSettingsError(message)
            throw new Error(message)
        }
        finally {
            settingsRequestInFlightRef.current = false
            setSettingsBusy(false)
        }
    }, [])

    const clearError = useCallback(() => setError(null), [])
    const clearSettingsError = useCallback(() => setSettingsError(null), [])
    const clearRoomActionError = useCallback(() => setRoomActionError(null), [])
    const setReady = useCallback((
        selectedDeckId: number,
        direction: GameDirection,
        modifiers: ActiveGameModifier[],
        settingsVersion: number
    ) => runRoomAction("SetReady", selectedDeckId, direction, modifiers, settingsVersion), [runRoomAction])
    const setUnready = useCallback(() => runRoomAction("SetUnready"), [runRoomAction])
    const startRace = useCallback(() => runRoomAction("StartRace"), [runRoomAction])
    const returnToLobby = useCallback(() => runRoomAction("ReturnToLobby"), [runRoomAction])
    const isConnectionBusy = connectionStatus === "connecting" || connectionStatus === "reconnecting"

    return {
        room,
        status: connectionStatus,
        error,
        isBusy: requestBusy || isConnectionBusy,
        isUpdatingSettings: settingsBusy,
        settingsError,
        isRunningRoomAction: roomActionBusy,
        roomActionError,
        roomSessionInvalidationId,
        createRoom,
        joinRoom,
        leaveRoom,
        updateRoomSettings,
        setReady,
        setUnready,
        startRace,
        returnToLobby,
        clearError,
        clearSettingsError,
        clearRoomActionError
    }
}
