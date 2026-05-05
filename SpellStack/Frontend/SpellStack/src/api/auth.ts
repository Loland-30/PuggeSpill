const API_URL = "http://localhost:5084/api"
const TOKEN_KEY = "spellstack_auth_token"

export interface AuthUser {
    id: number
    username: string
    email: string
    favoriteLanguage: string
    createdAt: string
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

export async function register(username: string, email: string, password: string, favoriteLanguage: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, favoriteLanguage })
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    if (!response.ok) throw new Error(await response.text())
    return response.json()
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
