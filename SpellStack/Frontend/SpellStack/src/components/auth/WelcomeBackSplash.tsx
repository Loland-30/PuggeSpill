import { motion } from "framer-motion"

import ProfileImage from "../ProfileImage"

interface WelcomeBackSplashProps {
    username: string
    profileImage?: string | null
    title?: string
}

export default function WelcomeBackSplash({
    username,
    profileImage,
    title = "Welcome back"
}: WelcomeBackSplashProps) {
    const initial = username.slice(0, 1).toUpperCase()

    return (
        <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.26, ease: "easeOut" }}
        >
            <motion.div
                className="relative mx-auto grid h-48 w-48 place-items-center overflow-hidden rounded-full bg-white/15 text-7xl font-black text-white shadow-2xl shadow-black/35 sm:h-56 sm:w-56"
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
            >
                {initial}
                <ProfileImage
                    src={profileImage ?? null}
                    alt={`${username} profile`}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            </motion.div>

            <p className="mt-8 text-2xl font-black text-white">
                {title}
            </p>
            <h1 className="mt-4 text-6xl font-black tracking-tight text-white sm:text-8xl">
                {username}
            </h1>
        </motion.div>
    )
}
