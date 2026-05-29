import type { ReactNode } from "react"
import { useId } from "react"
import { useTheme } from "../theme/ThemeContext"
import type { PaletteTheme } from "../types/PaletteTheme"

interface GradientFrameProps {
    children: ReactNode
    enabled?: boolean
    glow?: boolean
    glass?: boolean
    glassBackdrop?: boolean
    solid?: boolean
    radius?: number
    radiusClass?: string
    className?: string
    contentClassName?: string
    fillClassName?: string
    hoverFillClassName?: string
}

export default function GradientFrame({
    children,
    enabled = true,
    glow = false,
    glass = false,
    glassBackdrop = false,
    solid = false,
    radius = 8,
    radiusClass = "rounded-lg",
    className = "",
    contentClassName = "",
    fillClassName = "",
    hoverFillClassName = ""
}: GradientFrameProps) {
    const rawGradientId = useId()
    const gradientId = `gradient-frame-${rawGradientId.replaceAll(":", "")}`

    const { palette } = useTheme()
    const activePalette = palette as PaletteTheme

    const isGradientPalette = activePalette.kind === "gradient"
    const hasGlass = glass || glassBackdrop
    const hasSolid = solid && !hasGlass
    const frameFrom = activePalette.frameFrom ?? "#f43f5e"
    const frameTo = activePalette.frameTo ?? "#7c3aed"

    const frameGlass = activePalette.frameGlass ?? "bg-black/[0.12]"
    const frameGlow = activePalette.frameGlow ?? "shadow-[inset_0_0_32px_rgba(255,255,255,0.035)]"
    const outerGlowClass = glow ? activePalette.glow : ""
    const themedGlassSurfaceClass = isGradientPalette ? frameGlass : activePalette.card
    const softGlassVeilClass = "bg-black/[0.08]"
    const glassSurfaceClass = hasGlass
        ? `${softGlassVeilClass} backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.055),inset_0_0_42px_rgba(255,255,255,0.06)]`
        : ""
    const solidSurfaceClass = hasSolid
        ? `${activePalette.card} ${frameGlow} backdrop-blur-sm`
        : ""
    const baseSurfaceClass = hasGlass ? glassSurfaceClass : hasSolid ? solidSurfaceClass : activePalette.card
    const gradientSurfaceClass = hasGlass
        ? glassSurfaceClass
        : hasSolid
            ? solidSurfaceClass
            : `${frameGlass} ${frameGlow} backdrop-blur-[1.5px]`
    const glassHighlightClass = `
        pointer-events-none
        absolute
        inset-0
        ${radiusClass}
        bg-[linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.025)_38%,rgba(255,255,255,0.06))]
        opacity-90
    `
    const glassTintClass = `
        pointer-events-none
        absolute
        inset-0
        ${radiusClass}
        bg-[radial-gradient(circle_at_16%_0%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_92%_100%,rgba(255,255,255,0.08),transparent_32%)]
        mix-blend-screen
        opacity-70
    `
    const fillLayerClass = `
        pointer-events-none
        absolute
        inset-0
        ${radiusClass}
        transition-colors
        duration-200
        ${fillClassName}
        ${hoverFillClassName}
    `

    if (!enabled || !isGradientPalette) {
        return (
            <div
                className={`
                    group/gradient-frame
                    relative
                    overflow-hidden
                    ${radiusClass}
                    border
                    ${activePalette.border}
                    ${baseSurfaceClass}
                    ${outerGlowClass}
                    ${className}
                `}
            >
                {hasGlass && (
                    <>
                        <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${radiusClass} ${themedGlassSurfaceClass} opacity-45`} />
                        <div aria-hidden="true" className={glassHighlightClass} />
                        <div aria-hidden="true" className={glassTintClass} />
                    </>
                )}

                <div aria-hidden="true" className={fillLayerClass} />

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

    return (
        // --- Outer frame: owns shape and optional outer glow --- //
        <div
            className={`
                group/gradient-frame
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
                    pointer-events-none
                    absolute
                    inset-0
                    ${radiusClass}
                    ${gradientSurfaceClass}
                `}
            />

            {hasGlass && (
                <>
                    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${radiusClass} ${themedGlassSurfaceClass} opacity-45`} />
                    <div aria-hidden="true" className={glassHighlightClass} />
                    <div aria-hidden="true" className={glassTintClass} />
                </>
            )}

            <div aria-hidden="true" className={fillLayerClass} />

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
