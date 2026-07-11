import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { clearStoredToken, getMe, getStoredToken, login, logout, register, storeToken, updateAccountProfile as updateAccountProfileRequest, type AuthUser } from "../api/auth"
import { deleteProfileImage as deleteProfileImageRequest, uploadProfileImage as uploadProfileImageRequest } from "../api/profileImage"
import { deleteCustomAudio, uploadCustomAudio } from "../api/profileAudio"
import { stopMultiplayerConnection } from "../multiplayer/multiplayerConnection"
import { resolveAssetUrl } from "../utils/assetUrl"

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    profileImage: string | null
    setProfileImage: (image: File | null) => Promise<AuthUser | null>
    uploadProfileImage: (image: File) => Promise<AuthUser>
    deleteProfileImage: () => Promise<AuthUser | null>
    updateAccountProfile: (username: string, email: string, country: string) => Promise<AuthUser>
    uploadLoginSplashSound: (file: File) => Promise<AuthUser>
    deleteLoginSplashSound: () => Promise<AuthUser | null>
    uploadMainMenuMusic: (file: File) => Promise<AuthUser>
    deleteMainMenuMusic: () => Promise<AuthUser | null>
    loginUser: (email: string, password: string) => Promise<AuthUser>
    registerUser: (username: string, email: string, password: string, favoriteLanguage: string, country: string) => Promise<AuthUser>
    logoutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

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

    const profileImage = useMemo(() => resolveAssetUrl(user?.profileImageUrl), [user?.profileImageUrl])

    const uploadProfileImage = useCallback(async (image: File) => {
        const updatedUser = await uploadProfileImageRequest(image)
        setUser(updatedUser)
        window.dispatchEvent(new Event("spellstack-auth-changed"))
        return updatedUser
    }, [])

    const deleteProfileImage = useCallback(async () => {
        if (!user) return null

        const updatedUser = await deleteProfileImageRequest()
        setUser(updatedUser)
        window.dispatchEvent(new Event("spellstack-auth-changed"))
        return updatedUser
    }, [user])

    const setProfileImage = useCallback(async (image: File | null) => {
        if (!user) return null
        if (image) return uploadProfileImage(image)
        return deleteProfileImage()
    }, [deleteProfileImage, uploadProfileImage, user])

    const updateAccountProfile = useCallback(async (username: string, email: string, country: string) => {
        const updatedUser = await updateAccountProfileRequest(username, email, country)
        setUser(updatedUser)
        window.dispatchEvent(new Event("spellstack-auth-changed"))
        return updatedUser
    }, [])

    const updateCustomAudio = useCallback(async (
        operation: () => Promise<AuthUser>
    ) => {
        const updatedUser = await operation()
        setUser(updatedUser)
        window.dispatchEvent(new Event("spellstack-auth-changed"))
        return updatedUser
    }, [])

    const uploadLoginSplashSound = useCallback((file: File) => {
        return updateCustomAudio(() => uploadCustomAudio("login-splash", file))
    }, [updateCustomAudio])

    const deleteLoginSplashSound = useCallback(async () => {
        if (!user) return null
        return updateCustomAudio(() => deleteCustomAudio("login-splash"))
    }, [updateCustomAudio, user])

    const uploadMainMenuMusic = useCallback((file: File) => {
        return updateCustomAudio(() => uploadCustomAudio("main-menu", file))
    }, [updateCustomAudio])

    const deleteMainMenuMusic = useCallback(async () => {
        if (!user) return null
        return updateCustomAudio(() => deleteCustomAudio("main-menu"))
    }, [updateCustomAudio, user])

    const value = useMemo<AuthContextValue>(() => ({
        user,
        loading,
        profileImage,
        setProfileImage,
        uploadProfileImage,
        deleteProfileImage,
        updateAccountProfile,
        uploadLoginSplashSound,
        deleteLoginSplashSound,
        uploadMainMenuMusic,
        deleteMainMenuMusic,
        loginUser: async (email, password) => {
            const result = await login(email, password)
            storeToken(result.token)
            setUser(result.user)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
            return result.user
        },
        registerUser: async (username, email, password, favoriteLanguage, country) => {
            const result = await register(username, email, password, favoriteLanguage, country)
            storeToken(result.token)
            setUser(result.user)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
            return result.user
        },
        logoutUser: async () => {
            await stopMultiplayerConnection()
            await logout()
            setUser(null)
            window.dispatchEvent(new Event("spellstack-auth-changed"))
        }
    }), [
        deleteLoginSplashSound,
        deleteMainMenuMusic,
        deleteProfileImage,
        loading,
        profileImage,
        setProfileImage,
        updateAccountProfile,
        uploadLoginSplashSound,
        uploadMainMenuMusic,
        uploadProfileImage,
        user
    ])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used inside AuthProvider")
    return context
}
