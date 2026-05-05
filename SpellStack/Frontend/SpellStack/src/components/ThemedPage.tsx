import type { ReactNode } from "react"
import { useTheme } from "../theme/ThemeContext"
import { getOverlayOpacity } from "../theme/themes"

export default function ThemedPage({ children, className = "" }: { children: ReactNode; className?: string }) {
    const { theme, background } = useTheme()
    const overlayOpacity = getOverlayOpacity(theme.overlayStrength)

    return (
        <div className={`relative min-h-screen overflow-hidden ${background.pageClass} ${className}`}>
            {theme.customBackgroundImage ? (
                <>
                    <div
                        className="fixed inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${theme.customBackgroundImage})` }}
                    />
                    <div className="fixed inset-0 bg-black" style={{ opacity: overlayOpacity }} />
                </>
            ) : (
                <div className={`fixed inset-0 ${background.backdropClass}`} />
            )}
            <div className="fixed inset-x-0 bottom-0 h-72 bg-[linear-gradient(180deg,transparent,#020617)]" />
            <div className="fixed left-[-7rem] top-48 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
            <div className="fixed right-[-8rem] bottom-32 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
            {children}
        </div>
    )
}
