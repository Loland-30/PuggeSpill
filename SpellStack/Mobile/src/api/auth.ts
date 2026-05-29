import * as SecureStore from "expo-secure-store"

import { API_URL } from "./config"
import { fetchWithTimeout } from "./http"

const TOKEN_KEY = "spellstack_auth_token"
let memoryToken: string | null = null

export interface AuthUser {
    id: number
    username: string
    email: string
    favoriteLanguage: string
    createdAt: string
    profileImageUrl?: string | null
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

export async function getStoredToken() {
    if (memoryToken) return memoryToken

    try {
        memoryToken = await SecureStore.getItemAsync(TOKEN_KEY)
    } catch {
        memoryToken = null
    }

    return memoryToken
}

export async function storeToken(token: string) {
    memoryToken = token
    await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearStoredToken() {
    memoryToken = null
    await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function authHeaders(): Promise<Record<string, string>> {
    const token = await getStoredToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (!response.ok) {
        const message = await response.text()
        throw new Error(message || fallbackMessage)
    }

    return response.json()
}

export async function register(username: string, email: string, password: string, favoriteLanguage: string): Promise<AuthResponse> {
    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, favoriteLanguage })
    })

    return parseResponse<AuthResponse>(response, "Could not create account")
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })

    return parseResponse<AuthResponse>(response, "Could not sign in")
}

export async function requestPasswordReset(email: string): Promise<string> {
    const response = await fetchWithTimeout(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })

    const result = await parseResponse<{ message: string }>(response, "Could not request password reset")
    return result.message
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
    const response = await fetchWithTimeout(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
    })

    const result = await parseResponse<{ message: string }>(response, "Could not reset password")
    return result.message
}

export async function getMe(): Promise<AuthUser> {
    const response = await fetchWithTimeout(`${API_URL}/auth/me`, {
        headers: await authHeaders()
    })

    return parseResponse<AuthUser>(response, "Not authenticated")
}

export async function logout(): Promise<void> {
    await fetchWithTimeout(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: await authHeaders()
    }).catch(() => undefined)

    await clearStoredToken()
}

export async function getProfileSummary(): Promise<ProfileSummary> {
    const response = await fetchWithTimeout(`${API_URL}/profile/summary`, {
        headers: await authHeaders()
    })

    return parseResponse<ProfileSummary>(response, "Could not load profile")
}

export async function getLanguageStats(): Promise<LanguageStats[]> {
    const response = await fetchWithTimeout(`${API_URL}/profile/languages`, {
        headers: await authHeaders()
    })

    return parseResponse<LanguageStats[]>(response, "Could not load language stats")
}
