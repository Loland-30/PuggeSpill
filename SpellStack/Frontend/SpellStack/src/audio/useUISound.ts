import { useCallback, type MouseEventHandler } from "react"

import { useTheme } from "../theme/ThemeContext"
import { getAudioPreset } from "./audioPresets"

const hoverCooldownMs = 85
const audioCache = new Map<string, HTMLAudioElement>()
let lastHoverSoundAt = 0

function clampVolume(volume: number) {
    return Math.min(1, Math.max(0, volume))
}

function getCachedAudio(key: string, file: string) {
    const cachedAudio = audioCache.get(key)
    if (cachedAudio) return cachedAudio

    const audio = new Audio(file)
    audio.preload = "auto"
    audioCache.set(key, audio)

    return audio
}

function shouldIgnoreTarget(target: HTMLElement | null) {
    if (!target) return false
    if (target.dataset.noHoverSound === "true") return true
    if (target.getAttribute("aria-disabled") === "true") return true
    if (target instanceof HTMLButtonElement && target.disabled) return true
    if (target instanceof HTMLInputElement) return true
    if (target instanceof HTMLTextAreaElement) return true
    if (target instanceof HTMLSelectElement) return true

    return false
}

export function useUISound() {
    const { theme } = useTheme()

    const playHoverSound = useCallback<MouseEventHandler<HTMLElement>>((event) => {
        if (shouldIgnoreTarget(event.currentTarget)) return
        if (!theme.audio.audioEnabled || theme.audio.uiVolume <= 0) return

        const preset = getAudioPreset(theme.audio.hoverSound)
        if (!preset) return

        const now = Date.now()
        if (now - lastHoverSoundAt < hoverCooldownMs) return

        lastHoverSoundAt = now

        const audio = getCachedAudio(preset.key, preset.file)
        audio.pause()
        audio.currentTime = 0
        audio.volume = clampVolume(theme.audio.uiVolume)
        audio.play().catch(() => undefined)
    }, [theme.audio.audioEnabled, theme.audio.hoverSound, theme.audio.uiVolume])

    return { playHoverSound }
}
