import type { ReactNode } from "react"

interface AppPageShellProps {
    children: ReactNode
    className?: string
    contentClassName?: string
}

export default function AppPageShell({
    children,
    className = "",
    contentClassName = ""
}: AppPageShellProps) {
    return (
        <div className={`relative z-10 min-h-[calc(100dvh-2rem)] w-full min-w-0 px-0 sm:min-h-[calc(100dvh-4rem)] sm:px-6 lg:px-10 xl:px-12 min-[1400px]:!px-60 ${className}`}>
            <main className={`mx-auto w-full max-w-6xl ${contentClassName}`}>
                {children}
            </main>
        </div>
    )
}
