import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { getLanguageStats, type LanguageStats } from "../api/auth"
import { useAuth } from "../auth/AuthContext"
import AchievementsPage from "../components/ProfileComponents/AchievementsPage"
import PerformancePage from "../components/ProfileComponents/PerformancePage"
import ProfilePage from "../components/ProfileComponents/ProfilePage"
import type { ProfileLanguage } from "../components/ProfileComponents/types"
import { countries, languages } from "../data/languages"

const profilePages = ["Profile", "Performance", "Achievements"] as const
const PROFILE_REGION_STORAGE_KEY = "spellstack_profile_region"

function getCountryFromValue(value: string) {
    const normalized = value.trim().toLowerCase()

    return countries.find(country =>
        country.label.toLowerCase() === normalized ||
        country.code.toLowerCase() === normalized
    )
}
function getLanguageFromValue(value: string) {
    const normalized = value.trim().toLowerCase()

    return languages.find(language =>
        language.label.toLowerCase() === normalized ||
        language.code.toLowerCase() === normalized
    )
}

function getLanguageFromCode(code: string) {
    return getLanguageFromValue(code) ?? {
        code,
        label: code.toUpperCase(),
        flagUrl: ""
    }
}

export default function ProfileContainer() {
    const navigate = useNavigate()
    const { user, loading, profileImage, setProfileImage } = useAuth()
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

    useEffect(() => {
        if (user) getLanguageStats().then(setLanguageStats)
    }, [user])

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
                ...getLanguageFromCode(stat.languageCode),
                stats: stat
            }))
            .filter((language, index, all) =>
                all.findIndex(item => item.code === language.code) === index
            )
    }, [languageStats, user?.favoriteLanguage])

    if (loading || !user) {
        return <div className="relative z-10 mt-20 text-center text-gray-400">Loading...</div>
    }

    const currentLanguage = profileLanguages.find(language => language.code === selectedLanguageCode) ?? profileLanguages[0]
    const createdAt = new Intl.DateTimeFormat("nb-NO").format(new Date(user.createdAt))
    const profileRegionCode = localStorage.getItem(PROFILE_REGION_STORAGE_KEY) ?? "no"
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
        profileRegionLabel: profileRegion?.label,
        profileLanguages,
        currentLanguage,
        onSelectLanguage: setSelectedLanguageCode,
        onProfileImageUpload: handleProfileImageUpload,
        onProfileImageRemove: handleProfileImageRemove,
        profileImageError
    }

    return (
        <div
            onWheel={handleWheel}
            className="relative z-10 mx-auto flex h-[calc(100vh-4rem)] w-full max-w-[102rem] flex-col overflow-hidden"
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
    )
}


