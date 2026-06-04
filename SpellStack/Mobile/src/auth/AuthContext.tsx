import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { clearStoredToken, getMe, getStoredToken, login, logout, register, storeToken, type AuthUser } from "../api/auth"
import { resolveAssetUrl } from "../utils/assetUrl"

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    profileImage: string | null
    refreshUser: () => Promise<AuthUser | null>
    loginUser: (email: string, password: string) => Promise<AuthUser>
    registerUser: (username: string, email: string, password: string, favoriteLanguage: string) => Promise<AuthUser>
    logoutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(false)

    const refreshUser = useCallback(async () => {
        try {
            const token = await getStoredToken()
            if (!token) {
                setUser(null)
                return null
            }

            const nextUser = await getMe()
            setUser(nextUser)
            return nextUser
        } catch {
            await clearStoredToken()
            setUser(null)
            return null
        }
    }, [])

    useEffect(() => {
        refreshUser().finally(() => undefined)
    }, [refreshUser])

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        profileImage: resolveAssetUrl(user?.profileImageUrl),
        refreshUser,
        loginUser: async (email, password) => {
            const result = await login(email, password)
            await storeToken(result.token)
            setUser(result.user)
            return result.user
        },
        registerUser: async (username, email, password, favoriteLanguage) => {
            const result = await register(username, email, password, favoriteLanguage)
            await storeToken(result.token)
            setUser(result.user)
            return result.user
        },
        logoutUser: async () => {
            await logout()
            setUser(null)
        }
    }), [refreshUser, user])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used inside AuthProvider")
    return context
}
