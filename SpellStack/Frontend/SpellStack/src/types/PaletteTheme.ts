export type PaletteThemeId =
    | "blue"
    | "pink"
    | "green"
    | "red"
    | "yellow"
    | "white"
    | "purpleGradient"
    | "mangoPop"
    | "frostByte"

export interface PaletteTheme {
    id: PaletteThemeId
    name: string
    kind: "solid" | "gradient"
    preview: string
    border: string
    glow: string
    card: string
    primaryButton: string
    primaryButtonText: string
    accentText: string
    frameGradient?: string
    frameFrom?: string
    frameTo?: string
    frameGlass?: string
    frameGlow?: string
}