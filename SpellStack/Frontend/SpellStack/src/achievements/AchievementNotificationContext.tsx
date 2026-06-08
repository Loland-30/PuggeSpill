import { Award, X } from "lucide-react"
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useLocation } from "react-router-dom"

import { checkAchievementUnlocks, type AchievementUnlock } from "../api/achievements"
import achievementUnlockedSoundUrl from "../assets/SFX/achievement_unlocked_sfx.mp3"
import { useOneShotAudio } from "../audio/useOneShotAudio"
import { useAuth } from "../auth/AuthContext"
import { useTheme } from "../theme/ThemeContext"

interface AchievementNotificationContextValue {
    showAchievements: (achievements?: AchievementUnlock[] | null) => void
}

const AchievementNotificationContext = createContext<AchievementNotificationContextValue | null>(null)
const toastDurationMs = 4200
export const achievementCheckRequestedEvent = "spellstack-achievement-check-requested"
export const achievementsUpdatedEvent = "spellstack-achievements-updated"

export function AchievementNotificationProvider({ children }: { children: ReactNode }) {
    const location = useLocation()
    const { user, loading } = useAuth()
    const [queue, setQueue] = useState<AchievementUnlock[]>([])
    const seenIds = useRef(new Set<string>())
    const checkInFlight = useRef<Promise<void> | null>(null)
    const activeAchievement = queue[0] ?? null

    const dismissCurrent = useCallback(() => {
        setQueue(current => current.slice(1))
    }, [])

    const showAchievements = useCallback((achievements?: AchievementUnlock[] | null) => {
        if (!achievements?.length) return

        const unseen = achievements.filter(achievement => {
            if (seenIds.current.has(achievement.id)) return false
            seenIds.current.add(achievement.id)
            return true
        })

        if (unseen.length > 0) {
            setQueue(current => [...current, ...unseen])
        }
    }, [])

    const checkForUnlocks = useCallback(() => {
        if (!user || loading) return Promise.resolve()
        if (checkInFlight.current) return checkInFlight.current

        const request = checkAchievementUnlocks()
            .then(achievements => {
                showAchievements(achievements)
                if (achievements.length > 0) {
                    window.dispatchEvent(new Event(achievementsUpdatedEvent))
                }
            })
            .catch(() => undefined)
            .finally(() => {
                checkInFlight.current = null
            })

        checkInFlight.current = request
        return request
    }, [loading, showAchievements, user])

    useEffect(() => {
        void checkForUnlocks()
    }, [checkForUnlocks, location.pathname, location.search])

    useEffect(() => {
        const handleCheckRequest = () => {
            void checkForUnlocks()
        }

        window.addEventListener(achievementCheckRequestedEvent, handleCheckRequest)
        return () => window.removeEventListener(achievementCheckRequestedEvent, handleCheckRequest)
    }, [checkForUnlocks])

    useEffect(() => {
        if (!activeAchievement) return

        const timer = window.setTimeout(dismissCurrent, toastDurationMs)
        return () => window.clearTimeout(timer)
    }, [activeAchievement, dismissCurrent])

    const value = useMemo(() => ({ showAchievements }), [showAchievements])

    return (
        <AchievementNotificationContext.Provider value={value}>
            {children}
            <AchievementToast achievement={activeAchievement} onDismiss={dismissCurrent} />
        </AchievementNotificationContext.Provider>
    )
}

export function useAchievementNotifications() {
    const context = useContext(AchievementNotificationContext)
    if (!context) {
        throw new Error("useAchievementNotifications must be used inside AchievementNotificationProvider")
    }
    return context
}

function AchievementToast({
    achievement,
    onDismiss
}: {
    achievement: AchievementUnlock | null
    onDismiss: () => void
}) {
    const { palette } = useTheme()
    const prefersReducedMotion = useReducedMotion()

    return (
        <div
            className="pointer-events-none fixed right-4 top-4 z-[10020] w-[min(24rem,calc(100vw-2rem))] sm:right-6 sm:top-6"
            aria-live="polite"
            aria-atomic="true"
        >
            <AnimatePresence mode="wait">
                {achievement && (
                    <motion.aside
                        key={achievement.id}
                        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 28, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.98 }}
                        transition={{ duration: prefersReducedMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className={`pointer-events-auto overflow-hidden rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} shadow-2xl backdrop-blur-xl`}
                    >
                        <AchievementUnlockSound key={achievement.id} />
                        <div className="relative p-5">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
                            <div className="relative flex items-start gap-4">
                                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                    <Award size={25} strokeWidth={2.5} />
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-black uppercase tracking-[0.2em] ${palette.accentText}`}>
                                        Achievement unlocked!
                                    </p>
                                    <h2 className="mt-1 text-xl font-black text-white">{achievement.name}</h2>
                                    {achievement.description && (
                                        <p className="mt-1 text-sm font-semibold leading-5 text-white/62">
                                            {achievement.description}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={onDismiss}
                                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    aria-label="Dismiss achievement notification"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </div>
    )
}

function AchievementUnlockSound() {
    const { theme } = useTheme()

    useOneShotAudio({
        source: achievementUnlockedSoundUrl,
        enabled: theme.audio.audioEnabled,
        volume: theme.audio.uiVolume
    })

    return null
}
