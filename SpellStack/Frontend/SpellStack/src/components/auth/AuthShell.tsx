import type { ReactNode } from "react"
import AuthStarfallBackground from "./AuthStarfallBackground"
import AuthTabs from "./AuthTabs"

interface AuthShellProps {
    mode: "login" | "signup"
    onModeChange: (mode: "login" | "signup") => void
    children: ReactNode
}

export default function AuthShell({ mode, onModeChange, children }: AuthShellProps) {
    return (
        <div className="fixed inset-0 overflow-y-auto bg-[#020617] text-white">
            <AuthStarfallBackground />
            <div className="relative z-10 flex min-h-screen flex-col px-6 py-9">
                <AuthTabs mode={mode} onModeChange={onModeChange} />
                <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center pb-12 pt-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
