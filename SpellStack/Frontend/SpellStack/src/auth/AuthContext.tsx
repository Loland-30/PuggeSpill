import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { clearStoredToken, getMe, getStoredToken, login, logout, register, storeToken, type AuthUser } from "../api/auth"

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    profileImage: string | null
    setProfileImage: (image: string | null) => void
    loginUser: (email: string, password: string) => Promise<void>
    registerUser: (username: string, email: string, password: string, favoriteLanguage: string) => Promise<void>
    logoutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getProfileImageKey(userId: number) {
    return `spellstack_profile_image_${userId}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [profileImage, setProfileImageState] = useState<string | null>(null)

    useEffect(() => {
        if (!getStoredToken()) {
            setLoading(false)
            return
        }

        getMe()
            .then(setUser)
            .catch(() => {
                clearStoredToken()
                setUser(null)
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        if (!user) {
            setProfileImageState(null)
            return
        }

        setProfileImageState(localStorage.getItem(getProfileImageKey(user.id)))
    }, [user])

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        profileImage,
        setProfileImage: image => {
            if (!user) return

            if (image) localStorage.setItem(getProfileImageKey(user.id), image)
            else localStorage.removeItem(getProfileImageKey(user.id))

            setProfileImageState(image)
        },
        loginUser: async (email, password) => {
            const result = await login(email, password)
            storeToken(result.token)
            setUser(result.user)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
        },
        registerUser: async (username, email, password, favoriteLanguage) => {
            const result = await register(username, email, password, favoriteLanguage)
            storeToken(result.token)
            setUser(result.user)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
        },
        logoutUser: async () => {
            await logout()
            setUser(null)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
        }
    }), [user, loading, profileImage])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used inside AuthProvider")
    return context
}
