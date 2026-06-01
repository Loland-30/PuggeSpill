import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "../../auth/AuthContext"
import WelcomeBackSplash from "../auth/WelcomeBackSplash"

const startupTipSeenKey = "spellstack_startup_tip_seen"
const welcomeBackSeenKey = "spellstack_welcome_back_seen"
const startupTipMinimumMs = 2500
const welcomeBackMs = 1050

type StartupGateStep = "startup-tip" | "welcome-back" | "ready"

interface AppStartupGateProps {
    children: ReactNode
}

function hasSessionFlag(key: string) {
    try {
        return sessionStorage.getItem(key) === "true"
    } catch {
        return true
    }
}

function setSessionFlag(key: string) {
    try {
        sessionStorage.setItem(key, "true")
    } catch {
        // Session storage can be unavailable in hardened/private contexts.
    }
}

export default function AppStartupGate({ children }: AppStartupGateProps) {
    const { user, loading, profileImage } = useAuth()
    const shouldShowStartupTip = useMemo(() => !hasSessionFlag(startupTipSeenKey), [])
    const shouldShowWelcomeBack = Boolean(user?.username) && !hasSessionFlag(welcomeBackSeenKey)
    const [startupTipElapsed, setStartupTipElapsed] = useState(!shouldShowStartupTip)
    const [step, setStep] = useState<StartupGateStep>(shouldShowStartupTip ? "startup-tip" : "ready")

    useEffect(() => {
        if (!shouldShowStartupTip) return

        const timer = window.setTimeout(() => {
            setStartupTipElapsed(true)
            setSessionFlag(startupTipSeenKey)
        }, startupTipMinimumMs)

        return () => window.clearTimeout(timer)
    }, [shouldShowStartupTip])

    useEffect(() => {
        if (step !== "startup-tip") return
        if (loading || !startupTipElapsed) return

        if (shouldShowWelcomeBack) {
            setSessionFlag(welcomeBackSeenKey)
            setStep("welcome-back")
            return
        }

        setStep("ready")
    }, [loading, shouldShowWelcomeBack, startupTipElapsed, step])

    useEffect(() => {
        if (step !== "ready") return
        if (loading) return
        if (!shouldShowWelcomeBack) return

        setSessionFlag(welcomeBackSeenKey)
        setStep("welcome-back")
    }, [loading, shouldShowWelcomeBack, step])

    useEffect(() => {
        if (step !== "welcome-back") return

        const timer = window.setTimeout(() => {
            setStep("ready")
        }, welcomeBackMs)

        return () => window.clearTimeout(timer)
    }, [step])

    return (
        <>
            {step === "ready" && children}

            <AnimatePresence>
                {step !== "ready" && (
                    <StartupOverlay key="startup-overlay">
                        <AnimatePresence mode="wait">
                            {step === "startup-tip" && (
                        <motion.div
                                    key="startup-tip"
                                    className="px-6 text-center text-3xl font-normal leading-tight text-white/90 sm:text-5xl"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            For the best experience, use Fullscreen (F11)
                        </motion.div>
                            )}

                            {step === "welcome-back" && user?.username && (
                                <WelcomeBackSplash
                                    key="welcome-back"
                                    username={user.username}
                                    profileImage={profileImage}
                                />
                            )}
                        </AnimatePresence>
                    </StartupOverlay>
                )}
            </AnimatePresence>
        </>
    )
}

function StartupOverlay({ children }: { children: ReactNode }) {
    return (
        <motion.div
            className="fixed inset-0 z-[10000] grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-6 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_18%_86%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_50%,#071426_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-950/30 to-transparent" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    )
}
