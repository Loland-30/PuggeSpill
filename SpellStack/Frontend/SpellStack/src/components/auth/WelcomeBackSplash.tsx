import { motion } from "framer-motion"

import { getAudioPreset } from "../../audio/audioPresets"
import { useOneShotAudio } from "../../audio/useOneShotAudio"
import { useTheme } from "../../theme/ThemeContext"
import ProfileImage from "../ProfileImage"

interface WelcomeBackSplashProps {
    username: string
    profileImage?: string | null
    soundUrl?: string | null
    title?: string
}

export default function WelcomeBackSplash({
    username,
    profileImage,
    soundUrl,
    title = "Welcome back"
}: WelcomeBackSplashProps) {
    const { theme } = useTheme()
    const initial = username.slice(0, 1).toUpperCase()
    const fallbackSound = getAudioPreset(theme.audio.signInSound)?.file ?? null

    useOneShotAudio({
        source: soundUrl,
        fallbackSource: fallbackSound,
        enabled: theme.audio.audioEnabled,
        volume: theme.audio.uiVolume
    })

    return (
        <motion.div
            className="mx-auto flex w-full min-w-0 max-w-[calc(100vw-2rem)] flex-col items-center text-center"
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
            <h1 className="mt-4 w-full max-w-6xl text-center text-[clamp(2.25rem,12vw,6rem)] font-black leading-[1.05] tracking-tight text-white [overflow-wrap:anywhere]">
                {username}
            </h1>
        </motion.div>
    )
}
