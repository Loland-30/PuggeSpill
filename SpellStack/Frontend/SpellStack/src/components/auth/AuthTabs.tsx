interface AuthTabsProps {
    mode: "login" | "signup"
    onModeChange: (mode: "login" | "signup") => void
}

export default function AuthTabs({ mode, onModeChange }: AuthTabsProps) {
    return (
        <div className="mx-auto flex w-fit items-center gap-10 rounded-full border border-white/10 bg-black/18 px-8 py-4 text-sm font-bold text-white/55 shadow-2xl backdrop-blur-xl">
            <button
                type="button"
                onClick={() => onModeChange("login")}
                className={`relative pb-1 transition ${mode === "login" ? "text-white" : "hover:text-white"}`}
            >
                Sign in
                <span className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-white transition ${mode === "login" ? "opacity-100" : "opacity-0"}`} />
            </button>
            <button
                type="button"
                onClick={() => onModeChange("signup")}
                className={`relative pb-1 transition ${mode === "signup" ? "text-white" : "hover:text-white"}`}
            >
                Sign up
                <span className={`absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-white transition ${mode === "signup" ? "opacity-100" : "opacity-0"}`} />
            </button>
        </div>
    )
}
