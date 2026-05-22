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
        <div className={`relative z-10 min-h-[calc(100vh-4rem)] w-full px-6 lg:px-52 xl:px-60 ${className}`}>
            <main className={`mx-auto w-full max-w-6xl ${contentClassName}`}>
                {children}
            </main>
        </div>
    )
}
