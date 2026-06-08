import { useEffect, useMemo, useState } from "react"
import { Check, Clock3, Flame, Languages, Lock, ShieldCheck, Swords, Trophy } from "lucide-react"
import { getAchievements, type Achievement } from "../../api/achievements"
import {
    achievementsUpdatedEvent,
    useAchievementNotifications
} from "../../achievements/AchievementNotificationContext"
import { useTheme } from "../../theme/ThemeContext"

const achievementCategories = [
    {
        title: "Mastery",
        icon: Trophy
    },
    {
        title: "Streaks",
        icon: Flame
    },
    {
        title: "Speed",
        icon: Clock3
    },
    {
        title: "Languages",
        icon: Languages
    },
    {
        title: "Challenges",
        icon: Swords
    }
] as const

const fallbackAchievements: Achievement[] = [
    { id: "mastery_first_deck", category: "Mastery", name: "First Deck Cleared", description: "Create your first deck.", unlocked: false, unlockedAt: null },
    { id: "mastery_100_words", category: "Mastery", name: "100 Words Learned", description: "Add 100 words across your decks.", unlocked: false, unlockedAt: null },
    { id: "mastery_perfect_practice", category: "Mastery", name: "Perfect Practice", description: "Reach a score of 1,000 on any deck.", unlocked: false, unlockedAt: null },
    { id: "streak_10", category: "Streaks", name: "10 Answer Streak", description: "Reach a 10 answer streak.", unlocked: false, unlockedAt: null },
    { id: "streak_flawless_round", category: "Streaks", name: "Flawless Round", description: "Reach a 20 answer streak.", unlocked: false, unlockedAt: null },
    { id: "streak_daily_spark", category: "Streaks", name: "Daily Spark", description: "Play 3 runs.", unlocked: false, unlockedAt: null },
    { id: "speed_under_pressure", category: "Speed", name: "Under Pressure", description: "Reach a score of 500.", unlocked: false, unlockedAt: null },
    { id: "speed_lightning_recall", category: "Speed", name: "Lightning Recall", description: "Reach a score of 1,500.", unlocked: false, unlockedAt: null },
    { id: "speed_fast_finish", category: "Speed", name: "Fast Finish", description: "Play 10 runs.", unlocked: false, unlockedAt: null },
    { id: "language_bilingual_start", category: "Languages", name: "Bilingual Start", description: "Practice your first learning language.", unlocked: false, unlockedAt: null },
    { id: "language_three_languages", category: "Languages", name: "Three Languages", description: "Practice 3 learning languages.", unlocked: false, unlockedAt: null },
    { id: "language_specialist", category: "Languages", name: "Language Specialist", description: "Add 50 words in one language.", unlocked: false, unlockedAt: null },
    { id: "challenge_rush_initiate", category: "Challenges", name: "Rush Initiate", description: "Reach a score of 1,000.", unlocked: false, unlockedAt: null },
    { id: "challenge_trial_runner", category: "Challenges", name: "Trial Runner", description: "Play 5 runs.", unlocked: false, unlockedAt: null },
    { id: "challenge_hardcore_victory", category: "Challenges", name: "Hardcore Victory", description: "Reach a score of 2,000.", unlocked: false, unlockedAt: null },
    { id: "challenge_hardcore_first_run", category: "Challenges", name: "Hardcore Initiate", description: "Complete one run with Hardcore active.", unlocked: false, unlockedAt: null },
    { id: "challenge_hardcore_10000", category: "Challenges", name: "Hardcore Master", description: "Reach a score of at least 10,000 with Hardcore active.", unlocked: false, unlockedAt: null }
]

type AchievementCategory = typeof achievementCategories[number]["title"]
type AchievementFilter = "All" | AchievementCategory

export default function AchievementsPage() {
    const { palette } = useTheme()
    const { showAchievements } = useAchievementNotifications()
    const [activeFilter, setActiveFilter] = useState<AchievementFilter>("All")
    const [achievements, setAchievements] = useState<Achievement[]>(fallbackAchievements)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const totalAchievements = achievements.length
    const unlockedCount = achievements.filter(achievement => achievement.unlocked).length
    const progressPercent = totalAchievements === 0 ? 0 : Math.round((unlockedCount / totalAchievements) * 100)

    useEffect(() => {
        let cancelled = false

        const loadAchievements = () => {
            setLoading(true)
            getAchievements()
                .then(data => {
                    if (cancelled) return
                    setAchievements(mergeAchievements(data.achievements))
                    showAchievements(data.newlyUnlockedAchievements)
                    setError("")
                })
                .catch(error => {
                    if (cancelled) return
                    setError(error instanceof Error ? error.message : "Kunne ikke hente achievements")
                })
                .finally(() => {
                    if (!cancelled) setLoading(false)
                })
        }

        loadAchievements()
        window.addEventListener(achievementsUpdatedEvent, loadAchievements)

        return () => {
            cancelled = true
            window.removeEventListener(achievementsUpdatedEvent, loadAchievements)
        }
    }, [showAchievements])

    const visibleAchievements = useMemo(() => {
        return achievements.filter(achievement => {
            return activeFilter === "All" || achievement.category === activeFilter
        })
    }, [achievements, activeFilter])

    return (
        <div
            onWheel={event => event.stopPropagation()}
            className="mx-auto flex h-full w-full max-w-[102rem] flex-col overflow-y-auto pb-10 pt-12 pr-2"
        >
            <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
                <div>
                    <p className={`text-sm font-black uppercase tracking-[0.35em] ${palette.accentText}`}>
                        Progress
                    </p>
                    <h1 className="mt-3 text-5xl font-black text-white">Achievements</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/68">
                        Milestones for mastery, streaks, speed, languages, and special challenge runs.
                    </p>
                </div>

                <div className={`rounded-lg border ${palette.border} ${palette.card} p-5 ${palette.glow}`}>
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/55">Unlocked</p>
                        <p className="text-sm font-bold text-white/60">{unlockedCount} / {totalAchievements}</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className={`h-full ${palette.primaryButton} transition-all duration-500`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            </header>

            <div className="mt-8 flex flex-wrap gap-3">
                {(["All", ...achievementCategories.map(category => category.title)] as AchievementFilter[]).map(filter => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`rounded-full border px-5 py-2 text-sm font-black transition ${
                            activeFilter === filter
                                ? `${palette.border} ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}`
                                : "border-white/10 bg-black/20 text-white/60 hover:border-white/35 hover:text-white"
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading && (
                    <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-white/60">
                        Loading achievements...
                    </div>
                )}

                {!loading && visibleAchievements.map(achievement => (
                    <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        icon={getCategoryIcon(achievement.category)}
                    />
                ))}
            </div>

            <div className="mt-7 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-5 py-4 text-white/65">
                <ShieldCheck size={20} strokeWidth={2.4} />
                <p className="text-sm">
                    {error
                        ? `${error}. Showing local achievement definitions until the API is reachable.`
                        : "Achievements unlock automatically from your saved decks, runs, streaks, languages, and scores."}
                </p>
            </div>
        </div>
    )
}

function AchievementCard({
    achievement,
    icon: Icon
}: {
    achievement: Achievement
    icon: typeof Trophy
}) {
    const { palette } = useTheme()

    return (
        <article className={`group flex min-h-36 items-start gap-4 rounded-lg border p-5 shadow-xl transition ${
            achievement.unlocked
                ? `${palette.border} ${palette.card} ${palette.glow}`
                : "border-white/10 bg-black/24 hover:border-white/30 hover:bg-white/10"
        }`}>
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg ${
                achievement.unlocked ? palette.primaryButton : "bg-white/10"
            } text-white shadow-lg`}>
                <Icon size={27} strokeWidth={2.4} />
            </span>

            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xl font-black text-white">{achievement.name}</p>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                        achievement.unlocked ? `${palette.primaryButton} ${palette.primaryButtonText}` : "bg-white/10 text-white/45"
                    }`}>
                        {achievement.unlocked ? (
                            <Check size={16} strokeWidth={3} />
                        ) : (
                            <Lock size={15} strokeWidth={2.6} />
                        )}
                    </span>
                </div>
                <p className={`mt-1 text-xs font-black uppercase tracking-[0.2em] ${palette.accentText}`}>
                    {achievement.category}
                </p>
                <p className="mt-3 text-sm leading-6 text-white/58">{achievement.description}</p>
                <p className={`mt-4 text-xs font-bold uppercase tracking-[0.18em] ${
                    achievement.unlocked ? "text-white/70" : "text-white/35"
                }`}>
                    {achievement.unlocked ? formatUnlockedDate(achievement.unlockedAt) : "Locked"}
                </p>
            </div>
        </article>
    )
}

function getCategoryIcon(category: string) {
    return achievementCategories.find(item => item.title === category)?.icon ?? Trophy
}

function mergeAchievements(remoteAchievements: Achievement[]) {
    const remoteById = new Map(
        remoteAchievements.map(achievement => [achievement.id, achievement])
    )
    const fallbackIds = new Set(
        fallbackAchievements.map(achievement => achievement.id)
    )

    return [
        ...fallbackAchievements.map(achievement =>
            remoteById.get(achievement.id) ?? achievement
        ),
        ...remoteAchievements.filter(achievement => !fallbackIds.has(achievement.id))
    ]
}

function formatUnlockedDate(unlockedAt: string | null) {
    if (!unlockedAt || unlockedAt.startsWith("0001-")) return "Unlocked"

    return `Unlocked ${new Intl.DateTimeFormat("nb-NO").format(new Date(unlockedAt))}`
}
