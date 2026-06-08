import { useCallback, useEffect, useRef } from "react"

import { getAudioPreset } from "./audioPresets"
import { useTheme } from "../theme/ThemeContext"
import { audioPreviewStartedEvent, audioPreviewStoppedEvent } from "./audioEvents"

export function useAudioPreview() {
    const { theme } = useTheme()
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const stopPreview = useCallback(() => {
        const audio = audioRef.current
        if (!audio) return

        audio.pause()
        audio.currentTime = 0
        audioRef.current = null
        window.dispatchEvent(new Event(audioPreviewStoppedEvent))
    }, [])

    useEffect(() => stopPreview, [stopPreview])

    const playUrl = useCallback((url: string | null | undefined, volume: number) => {
        if (!url || !theme.audio.audioEnabled || volume <= 0) return

        stopPreview()

        const audio = new Audio(url)
        audio.preload = "auto"
        audio.volume = Math.min(1, Math.max(0, volume))
        audioRef.current = audio
        audio.addEventListener("ended", () => {
            if (audioRef.current !== audio) return
            audioRef.current = null
            window.dispatchEvent(new Event(audioPreviewStoppedEvent))
        }, { once: true })
        window.dispatchEvent(new Event(audioPreviewStartedEvent))
        audio.play().catch(() => {
            if (audioRef.current === audio) {
                audioRef.current = null
                window.dispatchEvent(new Event(audioPreviewStoppedEvent))
            }
        })
    }, [stopPreview, theme.audio.audioEnabled])

    const playPreset = useCallback((presetKey: string | null | undefined) => {
        const preset = getAudioPreset(presetKey)
        if (!preset) return

        playUrl(preset.file, theme.audio.uiVolume)
    }, [playUrl, theme.audio.uiVolume])

    return { playPreset, playUrl, stopPreview }
}
