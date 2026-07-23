import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, CalendarDays, Pencil, RefreshCw, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import {
    getUpdateBySlug,
    getUpdates,
    deleteUpdate,
    UpdatesApiError,
    type UpdateDetails,
    type UpdateListItem
} from "../api/updates"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import UpdateCard from "../components/updates/UpdateCard"
import UpdateDeleteModal from "../components/updates/UpdateDeleteModal"
import UpdateMarkdown from "../components/updates/UpdateMarkdown"
import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"

export default function UpdateDetailsPage() {
    const { slug = "" } = useParams()
    const { t, appLanguage } = useI18n()
    const { palette } = useTheme()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [update, setUpdate] = useState<UpdateDetails | null>(null)
    const [otherUpdates, setOtherUpdates] = useState<UpdateListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState("")
    const activeRequestRef = useRef<AbortController | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<UpdateListItem | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")

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

    const closeDeleteModal = useCallback(() => {
        if (deleting) return
        setDeleteTarget(null)
        setDeleteError("")
    }, [deleting])

    const confirmDelete = async () => {
        if (!deleteTarget || deleting) return
        setDeleting(true)
        setDeleteError("")
        try {
            await deleteUpdate(deleteTarget.id)
            if (deleteTarget.id === update?.id) {
                navigate("/updates", { replace: true })
            } else {
                setOtherUpdates(current => current.filter(item => item.id !== deleteTarget.id))
                setDeleteTarget(null)
            }
        } catch (deleteFailure) {
            if (deleteFailure instanceof UpdatesApiError && (deleteFailure.status === 401 || deleteFailure.status === 403)) setDeleteError(t.updatesAdmin.adminRequired)
            else setDeleteError(t.updatesAdmin.deleteError)
        } finally {
            setDeleting(false)
        }
    }

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
                                    {user?.isAdmin && (
                                        <div className="mt-4 flex flex-wrap gap-2" aria-label={t.updatesAdmin.adminRequired}>
                                            <button type="button" onClick={() => navigate(`/updates/${update.slug}/edit`)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                                                <Pencil size={17} aria-hidden="true" />{t.updatesAdmin.editUpdate}
                                            </button>
                                            <button type="button" onClick={() => { setDeleteError(""); setDeleteTarget(update) }} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-950/75 px-4 text-sm font-black text-red-100 transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200">
                                                <Trash2 size={17} aria-hidden="true" />{t.updatesAdmin.deleteUpdate}
                                            </button>
                                        </div>
                                    )}
                                    <h1 className={`${publishedDate ? "mt-3" : ""} break-words text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl`}>
                                        {update.title}
                                    </h1>
                                    <p className="mt-5 max-w-3xl break-words text-lg font-semibold leading-8 text-white/70 sm:text-xl">
                                        {update.summary}
                                    </p>

                                    <div className="my-8 h-px bg-white/15 sm:my-10" />
                                    <UpdateMarkdown content={update.content} />
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
                                                onEdit={user?.isAdmin ? item => navigate(`/updates/${item.slug}/edit`) : undefined}
                                                onDelete={user?.isAdmin ? item => { setDeleteError(""); setDeleteTarget(item) } : undefined}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </AppPageShell>
            <UpdateDeleteModal update={deleteTarget} deleting={deleting} error={deleteError} onCancel={closeDeleteModal} onConfirm={() => void confirmDelete()} />
        </PageContentTransition>
    )
}
