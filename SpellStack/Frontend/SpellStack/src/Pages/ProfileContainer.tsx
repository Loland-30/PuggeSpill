import { useEffect, useMemo, useRef, useState, type WheelEvent } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { getLanguageStats, getPublicProfile, type LanguageStats, type PublicProfile } from "../api/auth"
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
import ProfileImage from "../components/ProfileImage"
import { resolveAssetUrl } from "../utils/assetUrl"
import { useTheme } from "../theme/ThemeContext"

const profilePages = ["Profile", "Performance", "Achievements"] as const
type ProfileNavigationState = {
    openedFrom?: "navbar" | "multiplayer-players-panel"
    returnTo?: string
    profileMode?: "full" | "preview"
}

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
    const location = useLocation()
    const { userId } = useParams()
    const { user, loading, profileImage, setProfileImage, logoutUser } = useAuth()
    const { palette } = useTheme()
    const { appLanguage } = useI18n()
    const locale = getAppLanguageLocale(appLanguage)
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
    const [selectedLanguageCode, setSelectedLanguageCode] = useState<string | null>(null)
    const [pageIndex, setPageIndex] = useState(0)
    const [isPageFading, setIsPageFading] = useState(false)
    const [profileImageError, setProfileImageError] = useState("")
    const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null)
    const [publicProfileError, setPublicProfileError] = useState("")
    const wheelLockedRef = useRef(false)
    const pageTransitionTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
        if (!loading && !user) navigate("/login")
    }, [loading, user, navigate])

    const isOwnProfile = !userId || (user ? userId === String(user.id) : false)
    const isPublicProfile = Boolean(userId && !isOwnProfile)
    const navigationState = location.state as ProfileNavigationState | null
    const openedFromPlayersPanel = navigationState?.openedFrom === "multiplayer-players-panel"

    const closeProfile = () => {
        if (navigationState?.returnTo) {
            navigate(navigationState.returnTo, { replace: true })
            return
        }

        navigate(-1)
    }

    const multiplayerCloseButton = openedFromPlayersPanel ? (
        <button
            type="button"
            onClick={closeProfile}
            aria-label="Close profile"
            className={`fixed right-4 top-4 z-40 grid h-11 w-11 place-items-center rounded-full border ${palette.border} ${palette.card} text-white/80 shadow-2xl transition hover:-translate-y-0.5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:right-8 sm:top-8`}
        >
            <X size={20} strokeWidth={2.5} aria-hidden="true" />
        </button>
    ) : null

    useEffect(() => {
        if (!isPublicProfile || !userId) return

        let cancelled = false
        setPublicProfileError("")
        getPublicProfile(userId)
            .then(profile => {
                if (!cancelled) setPublicProfile(profile)
            })
            .catch(error => {
                if (!cancelled) setPublicProfileError(error instanceof Error ? error.message : "Could not load player profile.")
            })

        return () => {
            cancelled = true
        }
    }, [isPublicProfile, userId])

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
        const publicCountry = publicProfile?.country ? getCountryFromValue(publicProfile.country) : undefined
        const publicLanguageCode = normalizeLanguageCode(publicProfile?.favoriteLanguage)
        const publicLanguageName = publicLanguageCode ? getLanguageName(publicLanguageCode, locale) : null

        return (
            <>
            {multiplayerCloseButton}
            <AppPageShell contentClassName="max-w-4xl">
                <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                    <section className={`w-full rounded-[2rem] border ${palette.border} ${palette.card} p-8 text-center shadow-2xl backdrop-blur-xl`}>
                        {publicProfile ? (
                            <div className="flex flex-col items-center">
                                <div className={`relative grid h-28 w-28 place-items-center overflow-hidden rounded-full ${palette.primaryButton} ${palette.primaryButtonText} text-4xl font-black`}>
                                    {publicProfile.username.slice(0, 1).toUpperCase()}
                                    <ProfileImage
                                        src={resolveAssetUrl(publicProfile.profileImageUrl)}
                                        alt={`${publicProfile.username} profile`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                </div>
                                <div className="mt-5 flex items-center justify-center gap-3">
                                    <h1 className="text-4xl font-black text-white">{publicProfile.username}</h1>
                                    {publicCountry && (
                                        <img
                                            src={publicCountry.flagUrl}
                                            alt={getCountryName(publicProfile.country!, locale)}
                                            title={getCountryName(publicProfile.country!, locale)}
                                            className="h-7 w-10 rounded-md object-cover"
                                        />
                                    )}
                                </div>
                                {publicLanguageName && <p className="mt-3 text-lg font-semibold text-white/70">{publicLanguageName}</p>}
                            </div>
                        ) : (
                            <p className={`text-base font-bold ${publicProfileError ? "text-red-200" : "text-white/60"}`}>
                                {publicProfileError || "Loading profile..."}
                            </p>
                        )}
                    </section>
                </div>
            </AppPageShell>
            </>
        )
    }

    const currentLanguage = profileLanguages.find(language => language.code === selectedLanguageCode) ?? profileLanguages[0]
    const createdAt = new Intl.DateTimeFormat(locale).format(new Date(user.createdAt))
    const profileRegionCode = user.country
    const profileRegion = profileRegionCode ? getCountryFromValue(profileRegionCode) : undefined
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

    const handleLogout = async () => {
        await logoutUser()
        navigate("/login")
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
        profileRegionLabel: profileRegionCode ? getCountryName(profileRegionCode, locale) : undefined,
        profileLanguages,
        currentLanguage,
        onSelectLanguage: setSelectedLanguageCode,
        onProfileImageUpload: handleProfileImageUpload,
        onProfileImageRemove: handleProfileImageRemove,
        onLogout: handleLogout,
        profileImageError
    }

    return (
        <>
        {multiplayerCloseButton}
        <AppPageShell contentClassName="max-w-[102rem]">
            <div
                onWheel={handleWheel}
                className="flex min-h-[calc(100dvh-7rem)] w-full flex-col md:h-[calc(100dvh-4rem)] md:overflow-hidden"
            >
            <header className="flex items-center justify-center overflow-x-auto pb-2">
                <nav className="flex min-w-max gap-6 text-sm text-white/80 sm:gap-10 sm:text-lg">
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

            <main className="relative min-h-0 flex-1">
                <motion.div
                    animate={{ opacity: isPageFading ? 0 : 1 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="relative min-h-full md:absolute md:inset-0 md:overflow-y-auto"
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
        </>
    )
}


