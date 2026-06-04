import type { ColorValue } from "react-native"

export type BackgroundThemeId = "night" | "aurora" | "sunset" | "forest" | "rose"
export type PaletteThemeId = "blue" | "pink" | "green" | "red" | "yellow" | "orange" | "purple" | "white" | "purpleGradient" | "mangoPop" | "frostByte"
export type OverlayStrength = "low" | "medium" | "high"
export type TextTone = "light" | "dark"

export interface BackgroundTheme {
    id: BackgroundThemeId
    name: string
    colors: readonly [ColorValue, ColorValue, ...ColorValue[]]
}

export interface PaletteTheme {
    id: PaletteThemeId
    name: string
    kind: "solid" | "gradient"
    accent: string
    primary: string
    primaryText: string
    border: string
    card: string
    mutedCard: string
    glow: string
    gradient?: readonly [ColorValue, ColorValue]
}

export interface AppTheme {
    backgroundId: BackgroundThemeId
    paletteId: PaletteThemeId
    customBackgroundImage: string | null
    overlayStrength: OverlayStrength
    textTone: TextTone
}

export const backgroundThemes: BackgroundTheme[] = [
    { id: "night", name: "Night Lake", colors: ["#071a2a", "#172033", "#020617"] },
    { id: "aurora", name: "Aurora", colors: ["#052e2b", "#082f49", "#020617"] },
    { id: "sunset", name: "Sunset", colors: ["#311020", "#431407", "#020617"] },
    { id: "forest", name: "Forest", colors: ["#052e16", "#064e3b", "#020617"] },
    { id: "rose", name: "Rose Nebula", colors: ["#2e073f", "#312e81", "#020617"] }
]

export const paletteThemes: PaletteTheme[] = [
    { id: "blue", name: "Blue", kind: "solid", accent: "#7dd3fc", primary: "#0ea5e9", primaryText: "#ffffff", border: "#38bdf8", card: "rgba(8, 47, 73, 0.76)", mutedCard: "rgba(8, 47, 73, 0.42)", glow: "rgba(56,189,248,0.32)" },
    { id: "pink", name: "Pink", kind: "solid", accent: "#f9a8d4", primary: "#ec4899", primaryText: "#ffffff", border: "#f472b6", card: "rgba(80, 7, 36, 0.76)", mutedCard: "rgba(80, 7, 36, 0.42)", glow: "rgba(244,114,182,0.32)" },
    { id: "green", name: "Green", kind: "solid", accent: "#6ee7b7", primary: "#10b981", primaryText: "#ffffff", border: "#34d399", card: "rgba(6, 78, 59, 0.72)", mutedCard: "rgba(6, 78, 59, 0.38)", glow: "rgba(52,211,153,0.32)" },
    { id: "red", name: "Red", kind: "solid", accent: "#fca5a5", primary: "#ef4444", primaryText: "#ffffff", border: "#f87171", card: "rgba(69, 10, 10, 0.76)", mutedCard: "rgba(69, 10, 10, 0.42)", glow: "rgba(248,113,113,0.32)" },
    { id: "yellow", name: "Yellow", kind: "solid", accent: "#facc15", primary: "#f59e0b", primaryText: "#111827", border: "#fbbf24", card: "rgba(113, 63, 18, 0.74)", mutedCard: "rgba(113, 63, 18, 0.36)", glow: "rgba(250,204,21,0.32)" },
    { id: "orange", name: "Orange", kind: "solid", accent: "#fdba74", primary: "#f97316", primaryText: "#ffffff", border: "#fb923c", card: "rgba(124, 45, 18, 0.7)", mutedCard: "rgba(124, 45, 18, 0.36)", glow: "rgba(251,146,60,0.32)" },
    { id: "purple", name: "Purple", kind: "solid", accent: "#c4b5fd", primary: "#8b5cf6", primaryText: "#ffffff", border: "#a78bfa", card: "rgba(76, 29, 149, 0.68)", mutedCard: "rgba(76, 29, 149, 0.36)", glow: "rgba(139,92,246,0.32)" },
    { id: "white", name: "White", kind: "solid", accent: "#ffffff", primary: "#ffffff", primaryText: "#111827", border: "#ffffff", card: "rgba(255, 255, 255, 0.20)", mutedCard: "rgba(255, 255, 255, 0.11)", glow: "rgba(255,255,255,0.24)" },
    { id: "purpleGradient", name: "Red Purple", kind: "gradient", accent: "#f0abfc", primary: "#db2777", primaryText: "#ffffff", border: "#d946ef", card: "rgba(30, 41, 59, 0.76)", mutedCard: "rgba(30, 41, 59, 0.42)", glow: "rgba(217,70,239,0.32)", gradient: ["#f43f5e", "#7c3aed"] },
    { id: "mangoPop", name: "Mango Pop", kind: "gradient", accent: "#ffb24d", primary: "#f97316", primaryText: "#ffffff", border: "#ff7a1a", card: "rgba(76, 5, 25, 0.66)", mutedCard: "rgba(76, 5, 25, 0.36)", glow: "rgba(248,155,41,0.32)", gradient: ["#ff0f7b", "#f89b29"] },
    { id: "frostByte", name: "Frost Byte", kind: "gradient", accent: "#60efff", primary: "#2563eb", primaryText: "#ffffff", border: "#60efff", card: "rgba(23, 37, 84, 0.66)", mutedCard: "rgba(23, 37, 84, 0.36)", glow: "rgba(96,239,255,0.32)", gradient: ["#0061ff", "#60efff"] }
]

export const defaultTheme: AppTheme = {
    backgroundId: "night",
    paletteId: "purpleGradient",
    customBackgroundImage: null,
    overlayStrength: "medium",
    textTone: "light"
}

export const overlayStrengths: Array<{ id: OverlayStrength; name: string; opacity: number }> = [
    { id: "low", name: "Low", opacity: 0.3 },
    { id: "medium", name: "Medium", opacity: 0.5 },
    { id: "high", name: "High", opacity: 0.75 }
]

export function getOverlayOpacity(strength: OverlayStrength) {
    return overlayStrengths.find(option => option.id === strength)?.opacity ?? 0.5
}

export function getBackgroundTheme(id: BackgroundThemeId) {
    return backgroundThemes.find(theme => theme.id === id) ?? backgroundThemes[0]
}

export function getPaletteTheme(id: PaletteThemeId): PaletteTheme {
    return paletteThemes.find(option => option.id === id) ?? paletteThemes[0]
}
