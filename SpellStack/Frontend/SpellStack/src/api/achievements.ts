import { API_URL } from "./config"
import { authHeaders } from "./auth"

export interface Achievement {
    id: string
    category: string
    name: string
    description: string
    unlocked: boolean
    unlockedAt: string | null
}

export interface AchievementUnlock {
    id: string
    category: string
    name: string
    description: string
    unlockedAt: string
}

export interface AchievementListResponse {
    achievements: Achievement[]
    newlyUnlockedAchievements: AchievementUnlock[]
}

export async function getAchievements(): Promise<AchievementListResponse> {
    const response = await fetch(`${API_URL}/achievements`, {
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Kunne ikke hente achievements")
    return response.json()
}

export async function checkAchievementUnlocks(): Promise<AchievementUnlock[]> {
    const response = await fetch(`${API_URL}/achievements/check`, {
        method: "POST",
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Kunne ikke sjekke achievements")
    return response.json()
}
