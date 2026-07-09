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
            <a
                href="https://github.com/Loland-30/Spellstack"
                target="_blank"
                rel="noreferrer"
                aria-label="View SpellStack source on GitHub"
                className="fixed bottom-5 right-5 z-30 grid h-12 w-12 place-items-center text-white/82 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] transition hover:text-white focus-visible:rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
            >
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-8 w-8 fill-current"
                >
                    <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.93.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.72 0 0 .84-.27 2.75 1.05A9.37 9.37 0 0 1 12 6.94c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.07 10.07 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                </svg>
            </a>
        </div>
    )
}
