import { API_URL } from "./config"
import { authHeaders, getStoredToken } from "./auth"
import type { AppTheme } from "../theme/themes"

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

export async function uploadThemeBackgroundImage(image: File): Promise<string> {
    const formData = new FormData()
    formData.append("image", image)

    const response = await fetch(`${API_URL}/theme/background-image`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
    })

    if (!response.ok) {
        throw new Error(await response.text() || "Kunne ikke laste opp bakgrunnsbilde")
    }

    const result: { url: string } = await response.json()
    return result.url
}
