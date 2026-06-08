import { useEffect, useMemo, useRef } from "react"
import { useLocation } from "react-router-dom"

import { getAudioPreset } from "../../audio/audioPresets"
import { audioPreviewStartedEvent, audioPreviewStoppedEvent } from "../../audio/audioEvents"
import { useAuth } from "../../auth/AuthContext"
import { useTheme } from "../../theme/ThemeContext"
import { resolveAssetUrl } from "../../utils/assetUrl"

export default function MainMenuAudio() {
    const location = useLocation()
    const { user } = useAuth()
    const { theme } = useTheme()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const customSource = useMemo(
        () => resolveAssetUrl(user?.customMainMenuMusicUrl),
        [user?.customMainMenuMusicUrl]
    )
    const fallbackSource = getAudioPreset(theme.audio.backgroundMusic)?.file ?? null
    const shouldPlay = Boolean(user) &&
        location.pathname !== "/login" &&
        location.pathname !== "/reset-password" &&
        theme.audio.audioEnabled &&
        theme.audio.musicVolume > 0

    useEffect(() => {
        const source = customSource || fallbackSource
        if (!shouldPlay || !source) return

        let audio = new Audio(source)
        let disposed = false
        let usingFallback = !customSource || customSource === fallbackSource

        const removeUnlockListeners = () => {
            window.removeEventListener("pointerdown", retryPlayback)
            window.removeEventListener("keydown", retryPlayback)
        }

        const retryPlayback = () => {
            if (disposed) return
            audio.play()
                .then(removeUnlockListeners)
                .catch(() => undefined)
        }

        const startPlayback = () => {
            audio.loop = true
            audio.preload = "auto"
            audio.volume = Math.min(1, Math.max(0, theme.audio.musicVolume))
            audioRef.current = audio
            audio.play().catch(() => {
                window.addEventListener("pointerdown", retryPlayback, { once: true })
                window.addEventListener("keydown", retryPlayback, { once: true })
            })
        }

        const handleError = () => {
            if (disposed || usingFallback || !fallbackSource) return

            audio.pause()
            usingFallback = true
            audio = new Audio(fallbackSource)
            audio.addEventListener("error", handleError)
            startPlayback()
        }

        audio.addEventListener("error", handleError)
        startPlayback()

        return () => {
            disposed = true
            removeUnlockListeners()
            audio.removeEventListener("error", handleError)
            audio.pause()
            audio.currentTime = 0
            if (audioRef.current === audio) audioRef.current = null
        }
    }, [customSource, fallbackSource, shouldPlay])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = Math.min(1, Math.max(0, theme.audio.musicVolume))
        }
    }, [theme.audio.musicVolume])

    useEffect(() => {
        const pauseForPreview = () => {
            audioRef.current?.pause()
        }
        const resumeAfterPreview = () => {
            if (!shouldPlay) return
            audioRef.current?.play().catch(() => undefined)
        }

        window.addEventListener(audioPreviewStartedEvent, pauseForPreview)
        window.addEventListener(audioPreviewStoppedEvent, resumeAfterPreview)
        return () => {
            window.removeEventListener(audioPreviewStartedEvent, pauseForPreview)
            window.removeEventListener(audioPreviewStoppedEvent, resumeAfterPreview)
        }
    }, [shouldPlay])

    return null
}
