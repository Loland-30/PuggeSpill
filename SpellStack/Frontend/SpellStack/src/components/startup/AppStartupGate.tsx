import { useEffect, useMemo, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useAuth } from "../../auth/AuthContext"
import { useTheme } from "../../theme/ThemeContext"
import { getOverlayOpacity } from "../../theme/themes"
import { resolveAssetUrl } from "../../utils/assetUrl"
import { preloadImage } from "../../utils/preloadImage"
import WelcomeBackSplash from "../auth/WelcomeBackSplash"
import { useI18n } from "../../i18n/I18nContext"

const startupTipSeenKey = "spellstack_startup_tip_seen"
const welcomeBackSeenKey = "spellstack_welcome_back_seen"
const startupTipMinimumMs = 2500
const welcomeBackMs = 1700

type StartupGateStep = "startup-tip" | "loading" | "welcome-back" | "ready"

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
    const { t } = useI18n()
    const { theme, isThemeReady, background } = useTheme()
    const prefersReducedMotion = useReducedMotion()
    const shouldShowStartupTip = useMemo(() => !hasSessionFlag(startupTipSeenKey), [])
    const shouldShowWelcomeBack = Boolean(user?.username) && !hasSessionFlag(welcomeBackSeenKey)
    const activeBackgroundImage = resolveAssetUrl(theme.customBackgroundImage)
    const overlayOpacity = getOverlayOpacity(theme.overlayStrength)
    const [startupTipElapsed, setStartupTipElapsed] = useState(!shouldShowStartupTip)
    const [assetsReady, setAssetsReady] = useState(false)
    const [step, setStep] = useState<StartupGateStep>(shouldShowStartupTip ? "startup-tip" : "loading")
    const bootstrapReady = !loading && isThemeReady && assetsReady
    const useThemeBackground = step === "welcome-back" && Boolean(user) && isThemeReady

    useEffect(() => {
        setAssetsReady(false)
        if (loading || !isThemeReady) return

        let cancelled = false

        Promise.all([
            preloadImage(profileImage),
            preloadImage(activeBackgroundImage)
        ]).then(() => {
            if (!cancelled) setAssetsReady(true)
        })

        return () => {
            cancelled = true
        }
    }, [activeBackgroundImage, isThemeReady, loading, profileImage])

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
        if (!bootstrapReady || !startupTipElapsed) return

        if (shouldShowWelcomeBack) {
            setSessionFlag(welcomeBackSeenKey)
            setStep("welcome-back")
            return
        }

        setStep("ready")
    }, [bootstrapReady, shouldShowWelcomeBack, startupTipElapsed, step])

    useEffect(() => {
        if (step !== "loading") return
        if (!bootstrapReady) return

        if (shouldShowWelcomeBack) {
            setSessionFlag(welcomeBackSeenKey)
            setStep("welcome-back")
            return
        }

        setStep("ready")
    }, [bootstrapReady, shouldShowWelcomeBack, step])

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
                    <StartupOverlay
                        key="startup-overlay"
                        useThemeBackground={useThemeBackground}
                        customBackgroundImage={activeBackgroundImage}
                        backdropClass={background.backdropClass}
                        overlayOpacity={overlayOpacity}
                        forceBlack={step === "startup-tip"}
                    >
                        <AnimatePresence mode="wait">
                            {step === "startup-tip" && (
                                <motion.div
                                    key="startup-tip"
                                    className="mx-auto w-full max-w-[22rem] whitespace-normal break-words px-2 text-center text-xl font-medium leading-relaxed text-white sm:max-w-4xl sm:text-3xl"
                                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                                    transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
                                >
                                    {t.startup.fullscreenRecommendation}
                                </motion.div>
                            )}

                            {step === "loading" && (
                                <motion.div
                                    key="loading"
                                    className="flex flex-col items-center gap-5 text-center text-white/88"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.22, ease: "easeOut" }}
                                >
                                    <span className="h-12 w-12 rounded-full border-2 border-white/20 border-t-white/85 animate-spin" />
                                    <p className="text-lg font-semibold tracking-wide">Loading SpellStack</p>
                                </motion.div>
                            )}

                            {step === "welcome-back" && user?.username && (
                                <WelcomeBackSplash
                                    key="welcome-back"
                                    username={user.username}
                                    profileImage={profileImage}
                                    soundUrl={resolveAssetUrl(user.customLoginSplashSoundUrl)}
                                />
                            )}
                        </AnimatePresence>
                    </StartupOverlay>
                )}
            </AnimatePresence>
        </>
    )
}

function StartupOverlay({
    children,
    useThemeBackground,
    customBackgroundImage,
    backdropClass,
    overlayOpacity,
    forceBlack
}: {
    children: ReactNode
    useThemeBackground: boolean
    customBackgroundImage: string | null
    backdropClass: string
    overlayOpacity: number
    forceBlack: boolean
}) {
    const [backgroundFailed, setBackgroundFailed] = useState(false)

    useEffect(() => {
        setBackgroundFailed(false)
    }, [customBackgroundImage])

    return (
        <motion.div
            className="fixed inset-0 z-[10000] flex min-h-screen min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4 text-white sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
        >
            {forceBlack ? (
                <div className="absolute inset-0 bg-black" />
            ) : useThemeBackground && customBackgroundImage && !backgroundFailed ? (
                <img
                    src={customBackgroundImage}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    onError={() => setBackgroundFailed(true)}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />
            ) : (
                <div className={`absolute inset-0 ${useThemeBackground ? backdropClass : "bg-[radial-gradient(circle_at_50%_78%,rgba(139,92,246,0.24),transparent_34%),radial-gradient(circle_at_18%_86%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#050816_50%,#071426_100%)]"}`} />
            )}
            {useThemeBackground && <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />}
            {!forceBlack && <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cyan-950/30 to-transparent" />}
            <div className="relative z-10 w-full min-w-0">{children}</div>
        </motion.div>
    )
}
