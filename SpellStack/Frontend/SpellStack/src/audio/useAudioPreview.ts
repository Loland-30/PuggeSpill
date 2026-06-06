import { useCallback } from "react"

import { getAudioPreset } from "./audioPresets"
import { useTheme } from "../theme/ThemeContext"

export function useAudioPreview() {
    const { theme } = useTheme()

    const playPreset = useCallback((presetKey: string | null | undefined) => {
        if (!theme.audio.audioEnabled || theme.audio.uiVolume <= 0) return

        const preset = getAudioPreset(presetKey)
        if (!preset) return

        const audio = new Audio(preset.file)
        audio.volume = Math.min(1, Math.max(0, theme.audio.uiVolume))
        audio.play().catch(() => undefined)
    }, [theme.audio.audioEnabled, theme.audio.uiVolume])

    return { playPreset }
}
