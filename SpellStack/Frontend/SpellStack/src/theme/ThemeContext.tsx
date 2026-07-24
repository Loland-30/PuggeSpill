import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { getStoredToken } from "../api/auth"
import { getUserTheme, saveUserTheme } from "../api/theme"
import { defaultTheme, getBackgroundTheme, getFontTheme, getPaletteTheme, getTextTone, normalizeTheme, type AppTheme, type AudioSettings, type BackgroundThemeId, type FontThemeId, type GlowStrength, type OverlayStrength, type PaletteThemeId, type TextTone } from "./themes"

interface ThemeContextValue {
    theme: AppTheme
    isThemeReady: boolean
    background: ReturnType<typeof getBackgroundTheme>
    palette: ReturnType<typeof getPaletteTheme>
    textTone: ReturnType<typeof getTextTone>
    setBackground: (backgroundId: BackgroundThemeId) => void
    setPalette: (paletteId: PaletteThemeId) => void
    setCustomBackgroundImage: (image: string | null) => void
    setOverlayStrength: (strength: OverlayStrength) => void
    setTextTone: (tone: TextTone) => void
    setGlowStrength: (strength: GlowStrength) => void
    setFont: (fontId: FontThemeId) => void
    setShowRomanization: (show: boolean) => void
    setAudioEnabled: (enabled: boolean) => void
    setUiVolume: (volume: number) => void
    setMusicVolume: (volume: number) => void
    setAudioPreset: <Key extends keyof AudioSettings>(key: Key, value: AudioSettings[Key]) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<AppTheme>(defaultTheme)
    const [remoteThemeReady, setRemoteThemeReady] = useState(() => !getStoredToken())
    const [allowThemeAutoSave, setAllowThemeAutoSave] = useState(false)
    const saveInFlightRef = useRef(false)
    const pendingThemeRef = useRef<AppTheme | null>(null)

    const queueThemeSave = useCallback((nextTheme: AppTheme) => {
        pendingThemeRef.current = nextTheme
        if (saveInFlightRef.current) return

        saveInFlightRef.current = true
        void (async () => {
            while (pendingThemeRef.current) {
                const themeToSave = pendingThemeRef.current
                pendingThemeRef.current = null

                try {
                    await saveUserTheme(themeToSave)
                } catch (error) {
                    console.error("Kunne ikke lagre theme", error)
                }
            }

            saveInFlightRef.current = false
        })()
    }, [])

    useEffect(() => {
        const loadRemoteTheme = async () => {
            if (!getStoredToken()) {
                setTheme(defaultTheme)
                setAllowThemeAutoSave(false)
                setRemoteThemeReady(true)
                return
            }

            setRemoteThemeReady(false)
            setAllowThemeAutoSave(false)
            try {
                const userTheme = await getUserTheme()
                if (userTheme) setTheme(normalizeTheme(userTheme))
                else {
                    setTheme(defaultTheme)
                    await saveUserTheme(defaultTheme)
                }
                setAllowThemeAutoSave(true)
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

    const updateTheme = (updater: (current: AppTheme) => AppTheme) => {
        setAllowThemeAutoSave(true)
        setTheme(updater)
    }

    const updateAudio = (nextAudio: Partial<AudioSettings>) => {
        updateTheme(current => ({
            ...current,
            audio: {
                ...current.audio,
                ...nextAudio
            }
        }))
    }

    const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume))

    useEffect(() => {
        if (getStoredToken() && remoteThemeReady && allowThemeAutoSave) {
            queueThemeSave(theme)
        }
    }, [allowThemeAutoSave, queueThemeSave, theme, remoteThemeReady])

    const palette = useMemo(
        () => getPaletteTheme(theme.paletteId, theme.glowStrength),
        [theme.glowStrength, theme.paletteId]
    )

    useEffect(() => {
        document.documentElement.style.setProperty("--spellstack-glow-rgb", palette.glowColor)
    }, [palette.glowColor])

    useEffect(() => {
        document.documentElement.style.setProperty("--app-font-family", getFontTheme(theme.fontId).family)
    }, [theme.fontId])

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        isThemeReady: remoteThemeReady,
        background: getBackgroundTheme(theme.backgroundId),
        palette,
        textTone: getTextTone(theme.textTone),
        setBackground: backgroundId => updateTheme(current => ({ ...current, backgroundId, customBackgroundImage: null })),
        setPalette: paletteId => updateTheme(current => ({ ...current, paletteId })),
        setCustomBackgroundImage: customBackgroundImage => updateTheme(current => ({ ...current, customBackgroundImage })),
        setOverlayStrength: overlayStrength => updateTheme(current => ({ ...current, overlayStrength })),
        setTextTone: textTone => updateTheme(current => ({ ...current, textTone })),
        setGlowStrength: glowStrength => updateTheme(current => ({ ...current, glowStrength })),
        setFont: fontId => updateTheme(current => ({ ...current, fontId })),
        setShowRomanization: showRomanization => updateTheme(current => ({ ...current, showRomanization })),
        setAudioEnabled: audioEnabled => updateAudio({ audioEnabled }),
        setUiVolume: uiVolume => updateAudio({ uiVolume: clampVolume(uiVolume) }),
        setMusicVolume: musicVolume => updateAudio({ musicVolume: clampVolume(musicVolume) }),
        setAudioPreset: (key, value) => updateAudio({ [key]: value } as Partial<AudioSettings>)
    }), [palette, remoteThemeReady, theme])

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error("useTheme must be used inside ThemeProvider")
    return context
}
