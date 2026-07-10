import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr"

import { getStoredToken } from "../api/auth"
import { API_ORIGIN } from "../api/config"

let connection: HubConnection | null = null
let startPromise: Promise<HubConnection> | null = null

export function getMultiplayerConnection() {
    if (!connection) {
        connection = new HubConnectionBuilder()
            .withUrl(`${API_ORIGIN}/hubs/multiplayer`, {
                accessTokenFactory: () => getStoredToken() ?? ""
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build()
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
