import { API_URL } from "./config"
const TOKEN_KEY = "spellstack_auth_token"
const connectionErrorMessage = "Could not connect to the server. Please try again later."

export interface AuthUser {
    id: number
    username: string
    email: string
    favoriteLanguage: string
    country: string | null
    createdAt: string
    profileImageUrl?: string | null
    customLoginSplashSoundUrl?: string | null
    customMainMenuMusicUrl?: string | null
    isAdmin: boolean
}

export interface AuthResponse {
    token: string
    user: AuthUser
}

export interface ProfileSummary {
    runsPlayed: number
    longestStreak: number
    wordsLearned: number
}

export interface LanguageStats {
    languageCode: string
    runsPlayed: number
    longestStreak: number
    wordsLearned: number
}

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function storeToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
    localStorage.removeItem(TOKEN_KEY)
}

export function authHeaders(): Record<string, string> {
    const token = getStoredToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface PublicProfile {
    id: number
    username: string
    favoriteLanguage: string
    country: string | null
    createdAt: string
    profileImageUrl: string | null
}

async function fetchAuth(input: RequestInfo | URL, init?: RequestInit) {
    try {
        return await fetch(input, init)
    } catch {
        throw new Error(connectionErrorMessage)
    }
}

async function readErrorMessage(response: Response, fallback: string) {
    const message = (await response.text()).trim()
    return message || fallback
}

export async function register(username: string, email: string, password: string, favoriteLanguage: string, country: string): Promise<AuthResponse> {
    const response = await fetchAuth(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, favoriteLanguage, country })
    })
    if (!response.ok) throw new Error(await readErrorMessage(response, "Could not create your account. Please try again."))
    return response.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetchAuth(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    if (!response.ok) throw new Error(await readErrorMessage(response, "Could not sign in. Please check your details and try again."))
    return response.json()
}

export async function requestPasswordReset(email: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
    if (!response.ok) throw new Error(await response.text())
    const result: { message: string } = await response.json()
    return result.message
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
    })
    if (!response.ok) throw new Error(await response.text())
    const result: { message: string } = await response.json()
    return result.message
}

export async function getMe(): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Not authenticated")
    return response.json()
}

export async function logout(): Promise<void> {
    await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: authHeaders()
    })
    clearStoredToken()
}

export async function updateAccountProfile(username: string, email: string, country: string): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/profile/account`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ username, email, country })
    })
    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "Kunne ikke oppdatere kontoen")
    }
    return response.json()
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
): Promise<string> {
    const response = await fetch(`${API_URL}/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    })
    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || "Kunne ikke oppdatere passordet")
    }
    const result: { message: string } = await response.json()
    return result.message
}

export async function getProfileSummary(): Promise<ProfileSummary> {
    const response = await fetch(`${API_URL}/profile/summary`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente profil")
    return response.json()
}

export async function getLanguageStats(): Promise<LanguageStats[]> {
    const response = await fetch(`${API_URL}/profile/languages`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error("Kunne ikke hente språkstats")
    return response.json()
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
    const response = await fetch(`${API_URL}/profile/public/${encodeURIComponent(userId)}`, {
        headers: authHeaders()
    })
    if (!response.ok) throw new Error(await readErrorMessage(response, "Could not load player profile."))
    return response.json()
}
