import type { AuthUser } from "../../api/auth"
import WelcomeBackSplash from "./WelcomeBackSplash"

interface AuthWelcomeSplashProps {
    user?: AuthUser | null
    username?: string
    profileImage?: string | null
    profileImagePreview?: string | null
    avatarUrl?: string | null
    soundUrl?: string | null
    mode?: "login" | "register"
    variant?: "login" | "register"
}

export default function AuthWelcomeSplash({
    user,
    username,
    profileImage,
    profileImagePreview,
    avatarUrl,
    soundUrl,
    mode = "login",
    variant
}: AuthWelcomeSplashProps) {
    const displayName = username ?? user?.username ?? "Player"
    const splashMode = variant ?? mode
    const title = splashMode === "register" ? "Welcome" : "Welcome back"
    const image = profileImagePreview ?? profileImage ?? avatarUrl ?? null

    return (
        <div className="fixed inset-0 z-[10000] grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_18%_86%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_50%,#071426_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-950/30 to-transparent" />
            <div className="relative z-10">
                <WelcomeBackSplash username={displayName} profileImage={image} soundUrl={soundUrl} title={title} />
            </div>
        </div>
    )
}
