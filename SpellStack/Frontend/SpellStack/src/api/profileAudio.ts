import { API_URL } from "./config"
import { authHeaders, type AuthUser } from "./auth"

export type CustomAudioKind = "login-splash" | "main-menu"

async function parseAudioResponse(response: Response): Promise<AuthUser> {
    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "Could not update custom audio.")
    }

    return response.json()
}

export async function uploadCustomAudio(kind: CustomAudioKind, file: File): Promise<AuthUser> {
    const formData = new FormData()
    formData.append("audio", file)

    const response = await fetch(`${API_URL}/profile/audio/${kind}`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
    })

    return parseAudioResponse(response)
}

export async function deleteCustomAudio(kind: CustomAudioKind): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/profile/audio/${kind}`, {
        method: "DELETE",
        headers: authHeaders()
    })

    return parseAudioResponse(response)
}
