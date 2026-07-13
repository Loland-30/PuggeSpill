import type { ReactNode } from "react"
import { useTheme } from "../theme/ThemeContext"
import { getOverlayOpacity } from "../theme/themes"
import { resolveAssetUrl } from "../utils/assetUrl"

export default function ThemedPage({ children, className = "" }: { children: ReactNode; className?: string }) {
    const { theme, background } = useTheme()
    const overlayOpacity = getOverlayOpacity(theme.overlayStrength)
    const customBackgroundImage = resolveAssetUrl(theme.customBackgroundImage)

    return (
        <div className={`relative isolate min-h-screen min-h-dvh overflow-x-hidden ${background.pageClass} ${className}`}>
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                {customBackgroundImage ? (
                    <>
                        <img
                            src={customBackgroundImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 h-full w-full object-cover object-center"
                            draggable={false}
                        />
                        <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
                    </>
                ) : (
                    <div className={`absolute inset-0 ${background.backdropClass}`} />
                )}
                <div className="absolute inset-x-0 bottom-0 h-72 bg-[linear-gradient(180deg,transparent,#020617)]" />
            </div>

            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
