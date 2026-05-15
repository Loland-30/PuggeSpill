// @ts-nocheck
export type BackgroundThemeId = "night" | "aurora" | "sunset" | "forest" | "rose"
export type PaletteThemeId = "blue" | "pink" | "green" | "red" | "yellow" | "white" | "purpleGradient" | "mangoPop" | "frostByte"
export type OverlayStrength = "low" | "medium" | "high"
export type TextTone = "light" | "dark"

export interface BackgroundTheme {
    id: BackgroundThemeId
    name: string
    preview: string
    pageClass: string
    backdropClass: string
}

export interface PaletteTheme {
    id: PaletteThemeId
    name: string
    kind: "solid" | "gradient"
    accentText: string
    primaryButton: string
    primaryButtonText: string
    border: string
    card: string
    glow: string
    preview: string
    frameGradient?: string
    frameFrom?: string
    frameTo?: string
    frameGlass?: string
    frameGlow?: string
}

export interface AppTheme {
    backgroundId: BackgroundThemeId
    paletteId: PaletteThemeId
    customBackgroundImage: string | null
    overlayStrength: OverlayStrength
    textTone: TextTone
}

export const backgroundThemes: BackgroundTheme[] = [
    {
        id: "night",
        name: "Night Lake",
        preview: "from-slate-950 via-blue-950 to-slate-950",
        pageClass: "bg-gray-950",
        backdropClass: "bg-[radial-gradient(circle_at_72%_16%,rgba(14,165,233,0.2),transparent_32%),linear-gradient(180deg,#071a2a_0%,#172033_48%,#020617_100%)]"
    },
    {
        id: "aurora",
        name: "Aurora",
        preview: "from-emerald-950 via-cyan-950 to-indigo-950",
        pageClass: "bg-emerald-950",
        backdropClass: "bg-[radial-gradient(circle_at_25%_12%,rgba(52,211,153,0.28),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(56,189,248,0.22),transparent_32%),linear-gradient(180deg,#052e2b_0%,#082f49_52%,#020617_100%)]"
    },
    {
        id: "sunset",
        name: "Sunset",
        preview: "from-rose-950 via-orange-950 to-slate-950",
        pageClass: "bg-rose-950",
        backdropClass: "bg-[radial-gradient(circle_at_70%_18%,rgba(251,146,60,0.26),transparent_32%),radial-gradient(circle_at_25%_44%,rgba(244,63,94,0.18),transparent_30%),linear-gradient(180deg,#311020_0%,#431407_48%,#020617_100%)]"
    },
    {
        id: "forest",
        name: "Forest",
        preview: "from-green-950 via-emerald-950 to-slate-950",
        pageClass: "bg-green-950",
        backdropClass: "bg-[radial-gradient(circle_at_72%_18%,rgba(34,197,94,0.22),transparent_34%),linear-gradient(180deg,#052e16_0%,#064e3b_48%,#020617_100%)]"
    },
    {
        id: "rose",
        name: "Rose Nebula",
        preview: "from-fuchsia-950 via-purple-950 to-slate-950",
        pageClass: "bg-fuchsia-950",
        backdropClass: "bg-[radial-gradient(circle_at_70%_16%,rgba(217,70,239,0.24),transparent_32%),radial-gradient(circle_at_32%_38%,rgba(244,63,94,0.20),transparent_30%),linear-gradient(180deg,#2e073f_0%,#312e81_48%,#020617_100%)]"
    }
]

export const paletteThemes: PaletteTheme[] = [
    {
        id: "blue",
        name: "Blue",
        kind: "solid",
        accentText: "text-sky-300",
        primaryButton: "bg-sky-500 hover:bg-sky-400",
        primaryButtonText: "text-white",
        border: "border-sky-400",
        card: "bg-sky-950/70",
        glow: "shadow-[0_0_28px_rgba(56,189,248,0.28)]",
        preview: "bg-sky-400"
    },
    {
        id: "pink",
        name: "Pink",
        kind: "solid",
        accentText: "text-pink-300",
        primaryButton: "bg-pink-500 hover:bg-pink-400",
        primaryButtonText: "text-white",
        border: "border-pink-400",
        card: "bg-pink-950/75",
        glow: "shadow-[0_0_28px_rgba(244,114,182,0.28)]",
        preview: "bg-pink-400"
    },
    {
        id: "green",
        name: "Green",
        kind: "solid",
        accentText: "text-emerald-300",
        primaryButton: "bg-emerald-500 hover:bg-emerald-400",
        primaryButtonText: "text-white",
        border: "border-emerald-400",
        card: "bg-emerald-950/65",
        glow: "shadow-[0_0_28px_rgba(52,211,153,0.28)]",
        preview: "bg-emerald-400"
    },
    {
        id: "red",
        name: "Red",
        kind: "solid",
        accentText: "text-red-300",
        primaryButton: "bg-red-500 hover:bg-red-400",
        primaryButtonText: "text-white",
        border: "border-red-400",
        card: "bg-red-950/75",
        glow: "shadow-[0_0_28px_rgba(248,113,113,0.28)]",
        preview: "bg-red-400"
    },
    {
        id: "yellow",
        name: "Yellow",
        kind: "solid",
        accentText: "text-[#fcb103]",
        primaryButton: "bg-[#fcb103] hover:bg-[#f5c542]",
        primaryButtonText: "text-white",
        border: "border-[#fcb103]",
        card: "bg-yellow-950/85",
        glow: "shadow-[0_0_28px_rgba(252,177,3,0.3)]",
        preview: "bg-[#fcb103]"
    },
    {
        id: "white",
        name: "White",
        kind: "solid",
        accentText: "text-white",
        primaryButton: "bg-white hover:bg-gray-100",
        primaryButtonText: "text-gray-950",
        border: "border-white",
        card: "bg-white/20",
        glow: "shadow-[0_0_28px_rgba(255,255,255,0.28)]",
        preview: "bg-white"
    },

    // --- Gradients --- //

    {
        id: "purpleGradient",
        name: "Red Purple",
        kind: "gradient",
        accentText: "text-fuchsia-300",
        primaryButton: "bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-400 hover:to-violet-500",
        primaryButtonText: "text-white",
        border: "border-fuchsia-500",
        card: "bg-slate-800/75",
        glow: "shadow-[0_0_34px_rgba(217,70,239,0.35)]",
        preview: "bg-gradient-to-r from-rose-500 to-violet-600",
        frameGradient: "from-rose-500 to-violet-600",
        frameFrom: "#f43f5e",
        frameTo: "#7c3aed",
        frameGlass: "bg-purple-950/[0.2]",
        frameGlow: "shadow-[inset_0_0_32px_rgba(127,29,29,0.14)]"
    },
    {
        id: "mangoPop",
        name: "Mango Pop",
        kind: "gradient",
        accentText: "text-[#ff7a1a]",
        primaryButton: "bg-gradient-to-r from-[#ff0f7b] to-[#f89b29] hover:from-[#ff3f95] hover:to-[#ffb24d]",
        primaryButtonText: "text-white",
        border: "border-[#ff7a1a]",
        card: "bg-rose-950/65",
        glow: "shadow-[0_0_34px_rgba(248,155,41,0.35)]",
        preview: "bg-gradient-to-r from-[#ff0f7b] to-[#f89b29]",
        frameGradient: "from-[#ff0f7b] to-[#f89b29]",
        frameFrom: "#ff0f7b",
        frameTo: "#f89b29",
        frameGlass: "bg-red-950/[0.35]",
        frameGlow: "shadow-[inset_0_0_32px_rgba(127,29,29,0.14)]"
    },
    {
        id: "frostByte",
        name: "Frost Byte",
        kind: "gradient",
        accentText: "text-[#60efff]",
        primaryButton: "bg-gradient-to-r from-[#0061ff] to-[#60efff] hover:from-[#2c7dff] hover:to-[#8ff5ff]",
        primaryButtonText: "text-white",
        border: "border-[#60efff]",
        card: "bg-blue-950/65",
        glow: "shadow-[0_0_34px_rgba(96,239,255,0.35)]",
        preview: "bg-gradient-to-r from-[#0061ff] to-[#60efff]",
        frameGradient: "from-[#0061ff] to-[#60efff]",
        frameFrom: "#0061ff",
        frameTo: "#60efff",
        frameGlass: "bg-blue-950/[0.3]",
        frameGlow: "shadow-[inset_0_0_32px_rgba(96,239,255,0.10)]"
    }
]

export const defaultTheme: AppTheme = {
    backgroundId: "night",
    paletteId: "purpleGradient",
    customBackgroundImage: null,
    overlayStrength: "medium",
    textTone: "light"
}

export const textTones: Array<{ id: TextTone; name: string; inputClass: string; placeholderClass: string; panelClass: string }> = [
    {
        id: "light",
        name: "White text",
        inputClass: "text-white",
        placeholderClass: "placeholder:text-white/45",
        panelClass: "bg-white/10"
    },
    {
        id: "dark",
        name: "Black text",
        inputClass: "text-gray-950",
        placeholderClass: "placeholder:text-gray-500",
        panelClass: "bg-white/85"
    }
]

export function getTextTone(id: TextTone) {
    return textTones.find(option => option.id === id) ?? textTones[0]
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
