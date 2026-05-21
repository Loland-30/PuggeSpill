import { motion } from "framer-motion"
import ProfileImage from "../ProfileImage"

interface AuthWelcomeSplashProps {
    variant: "login" | "register"
    username: string
    avatarUrl: string | null
}

export default function AuthWelcomeSplash({ variant, username, avatarUrl }: AuthWelcomeSplashProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
            className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-[#242424] text-white"
        >
            <motion.div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_34%),linear-gradient(135deg,#242424,#1f1f22,#242424)]"
                animate={{ scale: [1, 1.03, 1], opacity: [0.78, 1, 0.78] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.04, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center text-center"
            >
                <motion.div
                    initial={{ scale: 0.92 }}
                    animate={{ scale: [0.96, 1.03, 1] }}
                    transition={{ duration: 1.15, ease: "easeInOut" }}
                    className="relative grid h-44 w-44 place-items-center overflow-hidden rounded-full bg-white text-6xl font-black text-slate-950 shadow-[0_0_54px_rgba(255,255,255,0.16)] sm:h-52 sm:w-52"
                >
                    {username.slice(0, 1).toUpperCase()}
                    <ProfileImage src={avatarUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </motion.div>
                <p className="mt-10 text-3xl font-black text-white">
                    {variant === "login" ? "Welcome back" : "Welcome"}
                </p>
                <h1 className="mt-5 text-6xl font-black tracking-tight text-white sm:text-7xl">{username}</h1>
            </motion.div>
        </motion.div>
    )
}
