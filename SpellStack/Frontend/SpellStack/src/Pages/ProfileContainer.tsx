import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react"
import { motion } from "framer-motion"
import { useNavigate, useParams } from "react-router-dom"
import { getLanguageStats, type LanguageStats } from "../api/auth"
import AppPageShell from "../components/layout/AppPageShell"
import { useAuth } from "../auth/AuthContext"
import AchievementsPage from "../components/ProfileComponents/AchievementsPage"
import PerformancePage from "../components/ProfileComponents/PerformancePage"
import ProfilePage from "../components/ProfileComponents/ProfilePage"
import type { ProfileLanguage } from "../components/ProfileComponents/types"
import { countries, getCountryName, normalizeCountryCode } from "../data/countries"
import { getLanguageName, languages, normalizeLanguageCode } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import { getAppLanguageLocale } from "../i18n/localeMap"
import { useTheme } from "../theme/ThemeContext"

const profilePages = ["Profile", "Performance", "Achievements"] as const
const PROFILE_REGION_STORAGE_KEY = "spellstack_profile_region"

function getCountryFromValue(value: string) {
    const normalized = normalizeCountryCode(value)
    return countries.find(country => country.code === normalized)
}
function getLanguageFromValue(value: string) {
    const normalized = normalizeLanguageCode(value)
    return languages.find(language => language.code === normalized)
}

function getLanguageFromCode(code: string, locale: string) {
    const language = getLanguageFromValue(code) ?? {
        code,
        label: code.toUpperCase(),
        flagUrl: ""
    }

    return { ...language, label: getLanguageName(language.code, locale) }
}

export default function ProfileContainer() {
    const navigate = useNavigate()
    const { userId } = useParams()
    const { user, loading, profileImage, setProfileImage } = useAuth()
    const { palette } = useTheme()
    const { appLanguage } = useI18n()
    const locale = getAppLanguageLocale(appLanguage)
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
    const [selectedLanguageCode, setSelectedLanguageCode] = useState<string | null>(null)
    const [pageIndex, setPageIndex] = useState(0)
    const [isPageFading, setIsPageFading] = useState(false)
    const [profileImageError, setProfileImageError] = useState("")
    const wheelLockedRef = useRef(false)
    const pageTransitionTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!loading && !user) navigate("/login")
    }, [loading, user, navigate])

    const isOwnProfile = !userId || (user ? userId === String(user.id) : false)
    const isPublicProfile = Boolean(userId && !isOwnProfile)

    useEffect(() => {
        if (user && isOwnProfile) getLanguageStats().then(setLanguageStats)
    }, [isOwnProfile, user])

    useEffect(() => {
        if (!selectedLanguageCode && languageStats.length > 0) {
            setSelectedLanguageCode(languageStats[0].languageCode)
        }
    }, [languageStats, selectedLanguageCode])

    useEffect(() => () => {
        if (pageTransitionTimeoutRef.current) window.clearTimeout(pageTransitionTimeoutRef.current)
    }, [])

    const profileLanguages = useMemo<ProfileLanguage[]>(() => {
        const fallbackLanguage = getLanguageFromValue(user?.favoriteLanguage ?? "") ?? languages[0]
        const stats = languageStats.length > 0
            ? languageStats
            : [{ languageCode: fallbackLanguage.code, runsPlayed: 0, longestStreak: 0, wordsLearned: 0 }]

        return stats
            .map(stat => ({
                ...getLanguageFromCode(stat.languageCode, locale),
                stats: stat
            }))
            .filter((language, index, all) =>
                all.findIndex(item => item.code === language.code) === index
            )
    }, [languageStats, locale, user?.favoriteLanguage])

    if (loading || !user) {
        return <div className="relative z-10 mt-20 text-center text-gray-400">Loading...</div>
    }

    if (isPublicProfile) {
        return (
            <AppPageShell contentClassName="max-w-4xl">
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <section className={`rounded-[2rem] border ${palette.border} ${palette.card} p-8 text-center shadow-2xl backdrop-blur-xl`}>
                        <p className={`text-xs font-black uppercase tracking-[0.24em] ${palette.accentText}`}>
                            Public profile
                        </p>
                        <h1 className="mt-3 text-4xl font-black text-white">Player profile preview</h1>
                        <p className="mx-auto mt-4 max-w-xl text-base font-semibold leading-7 text-white/62">
                            Public player profiles are wired at the route level now, but the backend endpoint for reading another user's profile is not implemented yet.
                        </p>
                        <p className="mt-5 text-sm font-bold text-white/42">
                            Requested user id: {userId}
                        </p>
                    </section>
                </div>
            </AppPageShell>
        )
    }

    const currentLanguage = profileLanguages.find(language => language.code === selectedLanguageCode) ?? profileLanguages[0]
    const createdAt = new Intl.DateTimeFormat(locale).format(new Date(user.createdAt))
    const profileRegionCode = user.country ?? localStorage.getItem(PROFILE_REGION_STORAGE_KEY) ?? "NO"
    const profileRegion = getCountryFromValue(profileRegionCode)
    const favoriteLanguageFlag = profileRegion?.flagUrl

    const handleProfileImageUpload = async (file: File | undefined) => {
        if (!file) return

        setProfileImageError("")
        try {
            await setProfileImage(file)
        } catch (error) {
            setProfileImageError(error instanceof Error ? error.message : "Could not upload profile image")
        }
    }

    const handleProfileImageRemove = async () => {
        setProfileImageError("")
        try {
            await setProfileImage(null)
        } catch (error) {
            setProfileImageError(error instanceof Error ? error.message : "Could not remove profile image")
        }
    }

    const setProfilePage = (nextIndex: number) => {
        if (nextIndex === pageIndex || isPageFading) return

        setIsPageFading(true)
        pageTransitionTimeoutRef.current = window.setTimeout(() => {
            setPageIndex(nextIndex)
            window.requestAnimationFrame(() => setIsPageFading(false))
        }, 280)
    }

    const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (Math.abs(event.deltaY) < 30 || wheelLockedRef.current) return

        wheelLockedRef.current = true
        const nextIndex = event.deltaY > 0
            ? Math.min(profilePages.length - 1, pageIndex + 1)
            : Math.max(0, pageIndex - 1)
        setProfilePage(nextIndex)

        window.setTimeout(() => {
            wheelLockedRef.current = false
        }, 650)
    }

    const sharedProps = {
        user,
        profileImage,
        createdAt,
        favoriteLanguageFlag,
        profileRegionLabel: getCountryName(profileRegionCode),
        profileLanguages,
        currentLanguage,
        onSelectLanguage: setSelectedLanguageCode,
        onProfileImageUpload: handleProfileImageUpload,
        onProfileImageRemove: handleProfileImageRemove,
        profileImageError
    }

    return (
        <AppPageShell contentClassName="max-w-[102rem]">
            <div
                onWheel={handleWheel}
                className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden"
            >
            <header className="flex items-center justify-center">
                <nav className="hidden gap-10 text-lg text-white/80 md:flex">
                    {profilePages.map((page, index) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => setProfilePage(index)}
                            className={`border-b pb-1 transition ${pageIndex === index ? "border-white text-white" : "border-transparent hover:text-white"}`}
                        >
                            {page}
                        </button>
                    ))}
                    <span>Multiplayer</span>
                </nav>
            </header>

            <main className="relative flex-1">
                <motion.div
                    animate={{ opacity: isPageFading ? 0 : 1 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {pageIndex === 0 && (
                        <ProfilePage {...sharedProps} />
                    )}

                    {pageIndex === 1 && (
                        <PerformancePage {...sharedProps} />
                    )}

                    {pageIndex === 2 && (
                        <AchievementsPage />
                    )}
                </motion.div>
            </main>
            </div>
        </AppPageShell>
    )
}


