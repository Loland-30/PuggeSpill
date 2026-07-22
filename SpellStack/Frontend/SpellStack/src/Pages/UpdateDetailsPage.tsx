import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, CalendarDays, RefreshCw } from "lucide-react"
import { Link, useParams } from "react-router-dom"

import {
    getUpdateBySlug,
    getUpdates,
    UpdatesApiError,
    type UpdateDetails,
    type UpdateListItem
} from "../api/updates"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import UpdateCard from "../components/updates/UpdateCard"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

function UpdateContent({ content }: { content: string }) {
    return (
        <div className="space-y-5 text-base font-medium leading-8 text-white/75 sm:text-lg">
            {content.split(/\n{2,}/).map((block, blockIndex) => {
                const lines = block.split("\n").filter(Boolean)
                const isList = lines.length > 0 && lines.every(line => line.startsWith("- "))

                if (isList) {
                    return (
                        <ul key={blockIndex} className="space-y-3 pl-5">
                            {lines.map(line => (
                                <li key={line} className="list-disc pl-1 marker:text-white/45">
                                    {line.slice(2)}
                                </li>
                            ))}
                        </ul>
                    )
                }

                return <p key={blockIndex} className="break-words">{block}</p>
            })}
        </div>
    )
}

export default function UpdateDetailsPage() {
    const { slug = "" } = useParams()
    const { t, appLanguage } = useI18n()
    const { palette } = useTheme()
    const [update, setUpdate] = useState<UpdateDetails | null>(null)
    const [otherUpdates, setOtherUpdates] = useState<UpdateListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState("")
    const activeRequestRef = useRef<AbortController | null>(null)

    const loadUpdate = useCallback(async () => {
        activeRequestRef.current?.abort()
        const controller = new AbortController()
        activeRequestRef.current = controller

        setLoading(true)
        setError("")
        setNotFound(false)

        try {
            const [nextUpdate, publishedUpdates] = await Promise.all([
                getUpdateBySlug(slug, controller.signal),
                getUpdates(controller.signal).catch(() => [])
            ])

            if (controller.signal.aborted) return
            setUpdate(nextUpdate)
            setOtherUpdates(publishedUpdates.filter(item => item.slug !== nextUpdate.slug).slice(0, 3))
        } catch (loadError) {
            if (controller.signal.aborted) return

            if (loadError instanceof UpdatesApiError && loadError.status === 404) {
                setNotFound(true)
            } else {
                console.error("Could not load update", loadError)
                setError(t.updatesPage.loadError)
            }
        } finally {
            if (!controller.signal.aborted && activeRequestRef.current === controller) {
                setLoading(false)
            }
        }
    }, [slug, t.updatesPage.loadError])

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            void loadUpdate()
        })

        return () => {
            window.cancelAnimationFrame(frame)
            activeRequestRef.current?.abort()
        }
    }, [loadUpdate])

    const publishedDate = update?.publishedAt
        ? new Intl.DateTimeFormat(appLanguage, { year: "numeric", month: "long", day: "numeric" }).format(new Date(update.publishedAt))
        : null

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="min-h-[calc(100dvh-7rem)] pb-24 pt-6 sm:min-h-[calc(100dvh-9rem)] sm:pb-12 sm:pt-10">
                <div className="mx-auto max-w-4xl">
                    <Link
                        to="/updates"
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 font-bold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                        <ArrowLeft size={19} aria-hidden="true" />
                        {t.updatesPage.backToUpdates}
                    </Link>

                    {loading && (
                        <div className={`mt-6 h-[32rem] animate-pulse rounded-lg border ${palette.border} bg-black/25`} aria-label={t.updatesPage.loading} />
                    )}

                    {!loading && (error || notFound) && (
                        <GradientFrame glass glow className="mt-6" contentClassName="p-7 text-center sm:p-12">
                            <h1 className="text-3xl font-black text-white sm:text-5xl">
                                {notFound ? t.updatesPage.notFoundTitle : t.updatesPage.loadError}
                            </h1>
                            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/65">
                                {notFound ? t.updatesPage.notFoundDescription : error}
                            </p>
                            {!notFound && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void loadUpdate()
                                    }}
                                    className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border ${palette.border} bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15`}
                                >
                                    <RefreshCw size={18} aria-hidden="true" />
                                    {t.updatesPage.retry}
                                </button>
                            )}
                        </GradientFrame>
                    )}

                    {!loading && !error && !notFound && update && (
                        <>
                            <GradientFrame glass glow className="mt-6" contentClassName="p-5 sm:p-9 lg:p-12">
                                <article>
                                    {publishedDate && (
                                        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-white/50 sm:text-sm">
                                            <CalendarDays size={16} aria-hidden="true" />
                                            {t.updatesPage.published} {publishedDate}
                                        </p>
                                    )}
                                    <h1 className={`${publishedDate ? "mt-3" : ""} break-words text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl`}>
                                        {update.title}
                                    </h1>
                                    <p className="mt-5 max-w-3xl break-words text-lg font-semibold leading-8 text-white/70 sm:text-xl">
                                        {update.summary}
                                    </p>

                                    <div className="my-8 h-px bg-white/15 sm:my-10" />
                                    <UpdateContent content={update.content} />
                                </article>
                            </GradientFrame>

                            {otherUpdates.length > 0 && (
                                <section className="mt-12 border-t border-white/15 pt-10 sm:mt-16 sm:pt-12" aria-labelledby="other-updates-heading">
                                    <h2 id="other-updates-heading" className="text-2xl font-black text-white sm:text-3xl">
                                        {t.updatesPage.otherUpdates}
                                    </h2>
                                    <div className="mt-6 grid min-w-0 gap-4 sm:gap-6">
                                        {otherUpdates.map(otherUpdate => (
                                            <UpdateCard
                                                key={otherUpdate.id}
                                                update={otherUpdate}
                                                locale={appLanguage}
                                                readMoreLabel={t.updatesPage.readMore}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </AppPageShell>
        </PageContentTransition>
    )
}
