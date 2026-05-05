import { authHeaders, getStoredToken } from "./auth"
import type { AppTheme } from "../theme/themes"

const API_URL = "http://localhost:5084/api"

export async function getUserTheme(): Promise<AppTheme | null> {
    if (!getStoredToken()) return null

    const response = await fetch(`${API_URL}/theme`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente theme")

    const result: { themeJson: string } = await response.json()
    if (!result.themeJson) return null

    return JSON.parse(result.themeJson)
}

export async function saveUserTheme(theme: AppTheme): Promise<void> {
    if (!getStoredToken()) return

    const response = await fetch(`${API_URL}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ themeJson: JSON.stringify(theme) })
    })
    if (!response.ok) throw new Error("Kunne ikke lagre theme")
}
