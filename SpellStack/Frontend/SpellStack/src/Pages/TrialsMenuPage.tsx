import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronDown, Play } from "lucide-react"

import FadeIn from "../components/FadeIn"
import LibraryPageToolbar from "../components/navigation/LibraryPageToolbar"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import ThemedPage from "../components/ThemedPage"
import { useAuth } from "../auth/AuthContext"
import { languages } from "../data/languages"
import { trials } from "../data/trials/trials"
import type { Trial } from "../data/trials/trialTypes"
import { useTheme } from "../theme/ThemeContext"
import { getTestingTrialRank } from "../testing/unlockRank"
import spanishTrialRankImage from "../assets/Es-Trial-Rank-img.webp"

function getTrialLanguageCode(language: Trial["language"]) {
    if (language === "spanish") return "es"
    if (language === "japanese") return "ja"
    return language
}

function getTrialLanguage(trial: Trial) {
    const languageCode = getTrialLanguageCode(trial.language)
    return languages.find(language => language.code === languageCode)
}

export default function TrialsMenuPage() {
    const navigate = useNavigate()
    const { user, loading: authLoading } = useAuth()
    const firstTrial = trials[0]

    useEffect(() => {
        if (authLoading) return
        if (!user) navigate("/login")
    }, [authLoading, user, navigate])


    if (authLoading) {
        return (
            <ThemedPage className="px-4 py-4 text-white sm:px-6 sm:py-8">
                <div className="relative z-10 mt-20 text-center text-gray-400">
                    Loading...
                </div>
            </ThemedPage>
        )
    }

    if (!firstTrial) return null

    return (
        <AppPageShell contentClassName="mt-4 flex min-h-[calc(100dvh-7rem)] flex-col sm:mt-14 min-[1400px]:h-[calc(100dvh-8rem)] min-[1400px]:overflow-hidden">
            <LibraryPageToolbar reserveActionsSlot />

            <PageContentTransition className="flex flex-1">
                <main className="flex flex-1 items-center justify-center overflow-x-hidden py-6 lg:overflow-hidden lg:py-0">
                    <TrialsShowcase
                        trial={firstTrial}
                        onStart={() => navigate(`/trials/${firstTrial.id}`)}
                    />
                </main>
            </PageContentTransition>
        </AppPageShell>
    )
}

function TrialsShowcase({ trial, onStart }: {
    trial: Trial
    onStart: () => void
}) {
    const { palette } = useTheme()
    const language = getTrialLanguage(trial)
    const trialRank = getTestingTrialRank(trial.id)

    return (
        <FadeIn className="grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-0 sm:px-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.82fr)] lg:gap-20 lg:px-12 xl:gap-28">
            <section className="flex flex-col items-start justify-center text-left">
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                    <h1 className="text-5xl font-black tracking-tight text-white sm:text-8xl">
                        Trials
                    </h1>

                    {language && (
                        <TrialLanguageDropdown
                            flagUrl={language.flagUrl}
                            label={language.label}
                        />
                    )}
                </div>

                <div className="mt-6 max-w-2xl space-y-4 text-lg font-medium leading-relaxed text-white/90 sm:mt-8 sm:space-y-5 sm:text-2xl">
                    <p>No enemies, no timer, no SFX.</p>
                    <p>Translate enough words to unlock higher Trials</p>
                </div>

                <button
                    onClick={onStart}
                    className={`mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl px-8 py-3 text-xl font-black sm:mt-14 sm:w-auto sm:min-w-56 sm:rounded-3xl sm:px-10 sm:py-4 sm:text-3xl ${palette.primaryButtonText} shadow-2xl transition hover:-translate-y-1 ${palette.primaryButton}`}
                >
                    <Play size={26} fill="currentColor" strokeWidth={2.6} />
                    Play
                </button>
            </section>

            <section className="flex flex-col items-center justify-center text-center">
                {trialRank && (
                    <img
                        src={spanishTrialRankImage}
                        alt={`${trial.title} rank placeholder`}
                        className=" drop-shadow-[0_0_34px_rgba(96,165,250,0.45)] sm:h-80 sm:w-80"
                    />
                )}

                <p className={`${trialRank ? "mt-8" : ""} text-3xl font-medium text-white`}>
                    Your Trial Rank: {trialRank?.name ?? "Unranked"}
                </p>
            </section>
        </FadeIn>
    )
}

function TrialLanguageDropdown({ flagUrl, label }: { flagUrl: string; label: string }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={() => setIsOpen(current => !current)}
                className="flex h-14 min-w-[6.5rem] items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/15 px-4 text-white shadow-xl backdrop-blur-md transition hover:bg-black/20"
                aria-expanded={isOpen}
                aria-label={`${label} trials`}
            >
                <img
                    src={flagUrl}
                    alt={`${label} flag`}
                    className="h-9 w-14 rounded-lg object-cover shadow-lg"
                />
                <ChevronDown
                    size={28}
                    strokeWidth={3}
                    className={`text-white transition ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            <div className={`absolute left-0 top-[calc(100%+0.55rem)] z-[210] w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl transition ${
                isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            }`}>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl bg-white/10 px-3 py-3 text-left text-sm font-bold text-white transition hover:bg-white/15"
                >
                    <img
                        src={flagUrl}
                        alt={`${label} flag`}
                        className="h-5 w-7 rounded-sm object-cover"
                    />
                    {label}
                </button>
            </div>
        </div>
    )
}
