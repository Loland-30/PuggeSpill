import { motion } from "framer-motion"

interface AuthWelcomeSplashProps {
    variant: "login" | "register"
    username: string
    avatarUrl: string | null
}

export default function AuthWelcomeSplash({ variant, username, avatarUrl }: AuthWelcomeSplashProps) {
    return (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_34%),linear-gradient(135deg,#050816,#16051d,#020617)]" />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04, y: -8 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center text-center"
            >
                <motion.div
                    initial={{ scale: 0.92 }}
                    animate={{ scale: 1.04 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="grid h-32 w-32 place-items-center overflow-hidden rounded-full bg-white text-5xl font-black text-slate-950 shadow-[0_0_48px_rgba(255,255,255,0.22)]"
                >
                    {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : username.slice(0, 1).toUpperCase()}
                </motion.div>
                <p className="mt-8 text-sm font-black uppercase tracking-[0.35em] text-white/45">
                    {variant === "login" ? "Welcome back" : "Welcome"}
                </p>
                <h1 className="mt-3 text-5xl font-black tracking-tight text-white">{username}</h1>
            </motion.div>
        </div>
    )
}
