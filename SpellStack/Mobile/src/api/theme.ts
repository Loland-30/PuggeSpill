import { API_URL } from "./config"
import { authHeaders, getStoredToken } from "./auth"
import { fetchWithTimeout } from "./http"
import type { AppTheme } from "../theme/themes"

export async function getUserTheme(): Promise<AppTheme | null> {
    if (!(await getStoredToken())) return null

    const response = await fetchWithTimeout(`${API_URL}/theme`, {
        headers: await authHeaders()
    })

    if (!response.ok) throw new Error((await response.text()) || "Could not load theme")

    const result: { themeJson: string } = await response.json()
    if (!result.themeJson) return null

    return JSON.parse(result.themeJson)
}

export async function saveUserTheme(theme: AppTheme): Promise<void> {
    if (!(await getStoredToken())) return

    const response = await fetchWithTimeout(`${API_URL}/theme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ themeJson: JSON.stringify(theme) })
    })

    if (!response.ok) throw new Error((await response.text()) || "Could not save theme")
}
