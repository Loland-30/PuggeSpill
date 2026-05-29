import { API_URL } from "./config"
import { authHeaders } from "./auth"
import { fetchWithTimeout } from "./http"

export interface Achievement {
    id: string
    category: string
    name: string
    description: string
    unlocked: boolean
    unlockedAt: string | null
}

export async function getAchievements(): Promise<Achievement[]> {
    const response = await fetchWithTimeout(`${API_URL}/achievements`, {
        headers: await authHeaders()
    })

    if (!response.ok) throw new Error((await response.text()) || "Could not load achievements")
    return response.json()
}
