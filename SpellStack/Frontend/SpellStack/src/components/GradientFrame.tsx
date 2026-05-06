import type { ReactNode } from "react"
import { useId } from "react"
import { useTheme } from "../theme/ThemeContext"
import type { PaletteTheme } from "../types/PaletteTheme"

interface GradientFrameProps {
    children: ReactNode
    enabled?: boolean
    glow?: boolean
    radius?: number
    radiusClass?: string
    className?: string
    contentClassName?: string
}

export default function GradientFrame({
    children,
    enabled = true,
    glow = false,
    radius = 8,
    radiusClass = "rounded-lg",
    className = "",
    contentClassName = ""
}: GradientFrameProps) {
    const rawGradientId = useId()
    const gradientId = `gradient-frame-${rawGradientId.replaceAll(":", "")}`

    const { palette } = useTheme()
    const activePalette = palette as PaletteTheme

    const isGradientPalette = activePalette.kind === "gradient"
    const frameFrom = activePalette.frameFrom ?? "#f43f5e"
    const frameTo = activePalette.frameTo ?? "#7c3aed"

    const frameGlass = activePalette.frameGlass ?? "bg-black/[0.12]"
    const frameGlow = activePalette.frameGlow ?? "shadow-[inset_0_0_32px_rgba(255,255,255,0.035)]"
    const outerGlowClass = glow ? activePalette.glow : ""

    if (!enabled || !isGradientPalette) {
        return (
            <div
                className={`
                    ${radiusClass}
                    border
                    ${activePalette.border}
                    ${activePalette.card}
                    ${outerGlowClass}
                    ${className}
                    ${contentClassName}
                `}
            >
                {children}
            </div>
        )
    }

    return (
        // --- Outer frame: owns shape and optional outer glow --- //
        <div
            className={`
                relative
                overflow-hidden
                ${radiusClass}
                ${outerGlowClass}
                ${className}
            `}
        >
            {/* --- Soft glass layer: keeps the card readable while still see-through --- */}
            <div
                aria-hidden="true"
                className={`
                    absolute
                    inset-0
                    ${radiusClass}
                    ${frameGlass}
                    ${frameGlow}
                    backdrop-blur-[1.5px]
                `}
            />

            {/* --- SVG border: gradient outline only, no filled center --- */}
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-[1px] h-[calc(100%-2px)] w-[calc(100%-2px)] overflow-visible"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={frameFrom} />
                        <stop offset="100%" stopColor={frameTo} />
                    </linearGradient>
                </defs>

                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    rx={Math.max(radius - 1, 0)}
                    ry={Math.max(radius - 1, 0)}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth="2.5"
                    opacity="0.95"
                />
            </svg>

            {/* --- Content layer: actual children/text/buttons --- */}
            <div
                className={`
                    relative
                    z-10
                    h-full
                    w-full
                    overflow-hidden
                    ${radiusClass}
                    ${contentClassName}
                `}
            >
                {children}
            </div>
        </div>
    )
}