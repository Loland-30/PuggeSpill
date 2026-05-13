import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getStoredToken } from "../api/auth"
import { getUserTheme, saveUserTheme } from "../api/theme"
import { defaultTheme, getBackgroundTheme, getPaletteTheme, getTextTone, type AppTheme, type BackgroundThemeId, type OverlayStrength, type PaletteThemeId, type TextTone } from "./themes"

interface ThemeContextValue {
    theme: AppTheme
    background: ReturnType<typeof getBackgroundTheme>
    palette: ReturnType<typeof getPaletteTheme>
    textTone: ReturnType<typeof getTextTone>
    setBackground: (backgroundId: BackgroundThemeId) => void
    setPalette: (paletteId: PaletteThemeId) => void
    setCustomBackgroundImage: (image: string | null) => void
    setOverlayStrength: (strength: OverlayStrength) => void
    setTextTone: (tone: TextTone) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>(defaultTheme)
    const [remoteThemeReady, setRemoteThemeReady] = useState(() => !getStoredToken())

    useEffect(() => {
        const loadRemoteTheme = async () => {
            if (!getStoredToken()) {
                setTheme(defaultTheme)
                setRemoteThemeReady(true)
                return
            }

            setRemoteThemeReady(false)
            try {
                const userTheme = await getUserTheme()
                if (userTheme) setTheme({ ...defaultTheme, ...userTheme })
                else {
                    setTheme(defaultTheme)
                    await saveUserTheme(defaultTheme)
                }
            } catch (error) {
                console.error("Kunne ikke laste theme for bruker", error)
            } finally {
                setRemoteThemeReady(true)
            }
        }

        loadRemoteTheme()
        window.addEventListener("spellstack-auth-changed", loadRemoteTheme)
        return () => window.removeEventListener("spellstack-auth-changed", loadRemoteTheme)
    }, [])

    useEffect(() => {
        if (getStoredToken() && remoteThemeReady) {
            saveUserTheme(theme).catch(error => console.error("Kunne ikke lagre theme", error))
        }
    }, [theme, remoteThemeReady])

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        background: getBackgroundTheme(theme.backgroundId),
        palette: getPaletteTheme(theme.paletteId),
        textTone: getTextTone(theme.textTone),
        setBackground: backgroundId => setTheme(current => ({ ...current, backgroundId })),
        setPalette: paletteId => setTheme(current => ({ ...current, paletteId })),
        setCustomBackgroundImage: customBackgroundImage => setTheme(current => ({ ...current, customBackgroundImage })),
        setOverlayStrength: overlayStrength => setTheme(current => ({ ...current, overlayStrength })),
        setTextTone: textTone => setTheme(current => ({ ...current, textTone }))
    }), [theme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error("useTheme must be used inside ThemeProvider")
    return context
}
