import { authHeaders } from "./auth"

const API_URL = `http://${window.location.hostname}:5084/api`

export interface Achievement {
    id: string
    category: string
    name: string
    description: string
    unlocked: boolean
    unlockedAt: string | null
}

export async function getAchievements(): Promise<Achievement[]> {
    const response = await fetch(`${API_URL}/achievements`, {
        headers: authHeaders()
    })

    if (!response.ok) throw new Error("Kunne ikke hente achievements")
    return response.json()
}
