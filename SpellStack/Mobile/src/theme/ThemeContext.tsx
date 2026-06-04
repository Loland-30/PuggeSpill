import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { getUserTheme, saveUserTheme } from "../api/theme"
import { defaultTheme, getBackgroundTheme, getPaletteTheme, type AppTheme } from "./themes"

interface ThemeContextValue {
    theme: AppTheme
    background: ReturnType<typeof getBackgroundTheme>
    palette: ReturnType<typeof getPaletteTheme>
    loading: boolean
    setTheme: (theme: AppTheme) => Promise<void>
    updateTheme: (patch: Partial<AppTheme>) => Promise<void>
    reloadTheme: () => Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<AppTheme>(defaultTheme)
    const [loading, setLoading] = useState(true)

    const reloadTheme = useCallback(async () => {
        setLoading(true)
        try {
            const savedTheme = await getUserTheme()
            setThemeState(savedTheme ?? defaultTheme)
        } catch {
            setThemeState(defaultTheme)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        reloadTheme()
    }, [reloadTheme])

    const setTheme = useCallback(async (nextTheme: AppTheme) => {
        setThemeState(nextTheme)
        await saveUserTheme(nextTheme).catch(() => undefined)
    }, [])

    const updateTheme = useCallback(async (patch: Partial<AppTheme>) => {
        const nextTheme = { ...theme, ...patch }
        await setTheme(nextTheme)
    }, [setTheme, theme])

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        background: getBackgroundTheme(theme.backgroundId),
        palette: getPaletteTheme(theme.paletteId),
        loading,
        setTheme,
        updateTheme,
        reloadTheme
    }), [loading, reloadTheme, setTheme, theme, updateTheme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error("useTheme must be used inside ThemeProvider")
    return context
}
