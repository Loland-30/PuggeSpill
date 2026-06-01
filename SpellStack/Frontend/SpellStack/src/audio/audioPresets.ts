import hoverSoftUrl from "../assets/SFX/ui_hover_soft_01.mp3"
import hoverSoftAltUrl from "../assets/SFX/ui_hover_soft_02.mp3"
import type { AudioPresetKey } from "../theme/themes"

export type AudioPresetCategory = "hover" | "click" | "success" | "error" | "signIn" | "backgroundMusic" | "inGameMusic"

export interface AudioPreset {
    key: AudioPresetKey
    displayName: string
    category: AudioPresetCategory
    file: string
}

export const audioPresets: AudioPreset[] = [
    {
        key: "ui_hover_soft_01",
        displayName: "Soft Hover",
        category: "hover",
        file: hoverSoftUrl
    },
    {
        key: "ui_hover_soft_02",
        displayName: "Soft Hover II",
        category: "hover",
        file: hoverSoftAltUrl
    }
]

export function getAudioPreset(key: string | null | undefined) {
    if (!key) return undefined
    return audioPresets.find(preset => preset.key === key)
}

export const hoverAudioPresets = audioPresets.filter(preset => preset.category === "hover")
