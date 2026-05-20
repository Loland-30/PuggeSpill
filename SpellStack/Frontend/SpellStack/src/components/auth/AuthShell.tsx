import type { ReactNode } from "react"
import AuthTabs from "./AuthTabs"

interface AuthShellProps {
    mode: "login" | "signup"
    onModeChange: (mode: "login" | "signup") => void
    children: ReactNode
}

export default function AuthShell({ mode, onModeChange, children }: AuthShellProps) {
    return (
        <div className="fixed inset-0 overflow-y-auto bg-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(236,72,153,0.24),transparent_32%),radial-gradient(circle_at_78%_22%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(135deg,#050816_0%,#18051f_48%,#020617_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.45)_1px,transparent_0)] [background-size:42px_42px]" />
            <div className="relative z-10 flex min-h-screen flex-col px-6 py-8">
                <AuthTabs mode={mode} onModeChange={onModeChange} />
                <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center py-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
