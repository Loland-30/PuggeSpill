import { useCallback, useEffect, useRef, useState } from "react"
import { RefreshCw } from "lucide-react"

import { getUpdates, type UpdateListItem } from "../api/updates"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import UpdateCard from "../components/updates/UpdateCard"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

export default function UpdatesPage() {
    const { t, appLanguage } = useI18n()
    const { palette } = useTheme()
    const [updates, setUpdates] = useState<UpdateListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const activeRequestRef = useRef<AbortController | null>(null)

    const loadUpdates = useCallback(async () => {
        activeRequestRef.current?.abort()
        const controller = new AbortController()
        activeRequestRef.current = controller
        setLoading(true)
        setError("")

        try {
            const nextUpdates = await getUpdates(controller.signal)
            if (!controller.signal.aborted) setUpdates(nextUpdates)
        } catch (loadError) {
            if (controller.signal.aborted) return
            console.error("Could not load updates", loadError)
            setError(t.updatesPage.loadError)
        } finally {
            if (!controller.signal.aborted && activeRequestRef.current === controller) {
                setLoading(false)
            }
        }
    }, [t.updatesPage.loadError])

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            void loadUpdates()
        })

        return () => {
            window.cancelAnimationFrame(frameId)
            activeRequestRef.current?.abort()
        }
    }, [loadUpdates])

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="min-h-[calc(100dvh-7rem)] pb-24 pt-8 sm:min-h-[calc(100dvh-9rem)] sm:pb-12 sm:pt-12">
                <header className="mx-auto max-w-3xl text-center">
                    <h1 className="text-4xl font-black text-white sm:text-6xl">
                        {t.updatesPage.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-white/70 sm:text-lg">
                        {t.updatesPage.description}
                    </p>
                </header>

                {loading && (
                    <div className="mx-auto mt-12 grid max-w-4xl gap-4" aria-live="polite" aria-label={t.updatesPage.loading}>
                        {[0, 1, 2].map(item => (
                            <div key={item} className={`h-48 animate-pulse rounded-lg border ${palette.border} bg-black/25`} />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <GradientFrame glass glow className="mx-auto mt-12 max-w-2xl" contentClassName="p-6 text-center sm:p-8">
                        <p className="text-lg font-bold text-white">{error}</p>
                        <button
                            type="button"
                            onClick={() => void loadUpdates()}
                            className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border ${palette.border} bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`}
                        >
                            <RefreshCw size={18} aria-hidden="true" />
                            {t.updatesPage.retry}
                        </button>
                    </GradientFrame>
                )}

                {!loading && !error && updates.length === 0 && (
                    <GradientFrame glass className="mx-auto mt-12 max-w-2xl" contentClassName="p-8 text-center">
                        <p className="text-lg font-bold text-white/75">{t.updatesPage.empty}</p>
                    </GradientFrame>
                )}

                {!loading && !error && updates.length > 0 && (
                    <section className="mx-auto mt-10 grid max-w-4xl gap-4 sm:mt-14 sm:gap-6" aria-label={t.updatesPage.title}>
                        {updates.map((update, index) => (
                            <UpdateCard
                                key={update.id}
                                update={update}
                                locale={appLanguage}
                                featured={index === 0}
                                readMoreLabel={t.updatesPage.readMore}
                            />
                        ))}
                    </section>
                )}
            </AppPageShell>
        </PageContentTransition>
    )
}
