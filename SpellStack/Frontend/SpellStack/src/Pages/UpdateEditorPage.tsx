import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { ArrowLeft, CalendarDays, RefreshCw } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { createUpdate, getUpdateBySlug, updateUpdate, UpdatesApiError, type UpdateDetails, type UpdatePostInput } from "../api/updates"
import GradientFrame from "../components/GradientFrame"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import UpdateMarkdown from "../components/updates/UpdateMarkdown"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import {
    deriveUpdateSummary,
    fromPublishedAt,
    getLocalCalendarDate,
    toPublishedAt,
    UPDATE_TITLE_MAX_LENGTH,
    UPDATE_VERSION_MAX_LENGTH
} from "../utils/updateEditor"

type EditorMode = "write" | "preview"
type FieldErrors = Partial<Record<"version" | "publishedDate" | "title" | "content", string>>

export default function UpdateEditorPage() {
    const { slug } = useParams()
    const editing = Boolean(slug)
    const navigate = useNavigate()
    const { t, appLanguage } = useI18n()
    const { palette } = useTheme()
    const [loadedUpdate, setLoadedUpdate] = useState<UpdateDetails | null>(null)
    const [version, setVersion] = useState("")
    const [publishedDate, setPublishedDate] = useState(getLocalCalendarDate)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [mode, setMode] = useState<EditorMode>("write")
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [submitError, setSubmitError] = useState("")
    const [loading, setLoading] = useState(editing)
    const [loadError, setLoadError] = useState("")
    const [notFound, setNotFound] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const requestRef = useRef<AbortController | null>(null)

    const loadUpdate = useCallback(async () => {
        if (!slug) return

        requestRef.current?.abort()
        const controller = new AbortController()
        requestRef.current = controller
        setLoading(true)
        setLoadError("")
        setNotFound(false)

        try {
            const nextUpdate = await getUpdateBySlug(slug, controller.signal)
            if (controller.signal.aborted) return
            setLoadedUpdate(nextUpdate)
            setVersion(nextUpdate.version)
            setPublishedDate(fromPublishedAt(nextUpdate.publishedAt))
            setTitle(nextUpdate.title)
            setContent(nextUpdate.content)
        } catch (error) {
            if (controller.signal.aborted) return
            if (error instanceof UpdatesApiError && error.status === 404) setNotFound(true)
            else setLoadError(t.updatesAdmin.loadError)
        } finally {
            if (!controller.signal.aborted && requestRef.current === controller) setLoading(false)
        }
    }, [slug, t.updatesAdmin.loadError])

    useEffect(() => {
        if (!editing) return

        const frame = window.requestAnimationFrame(() => {
            void loadUpdate()
        })

        return () => {
            window.cancelAnimationFrame(frame)
            requestRef.current?.abort()
        }
    }, [editing, loadUpdate])

    const validate = () => {
        const nextErrors: FieldErrors = {}
        if (!version.trim()) nextErrors.version = t.updatesAdmin.required
        if (!publishedDate) nextErrors.publishedDate = t.updatesAdmin.required
        if (!title.trim()) nextErrors.title = t.updatesAdmin.required
        if (!content.trim()) nextErrors.content = t.updatesAdmin.required
        setFieldErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (submitting || !validate()) return

        setSubmitting(true)
        setSubmitError("")

        const input: UpdatePostInput = {
            slug: null,
            version: version.trim(),
            title: title.trim(),
            summary: deriveUpdateSummary(content),
            content,
            category: loadedUpdate?.category || "General",
            status: loadedUpdate?.status || "Released",
            isPublished: true,
            publishedAt: toPublishedAt(publishedDate)
        }

        try {
            const savedUpdate = editing && loadedUpdate
                ? await updateUpdate(loadedUpdate.id, input)
                : await createUpdate(input)
            navigate(`/updates/${savedUpdate.slug}`)
        } catch (error) {
            if (error instanceof UpdatesApiError && (error.status === 401 || error.status === 403)) {
                setSubmitError(t.updatesAdmin.adminRequired)
            } else if (error instanceof UpdatesApiError && error.message) {
                setSubmitError(error.message)
            } else {
                setSubmitError(editing ? t.updatesAdmin.saveError : t.updatesAdmin.publishError)
            }
        } finally {
            setSubmitting(false)
        }
    }

    const formattedPreviewDate = publishedDate
        ? new Intl.DateTimeFormat(appLanguage, { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(toPublishedAt(publishedDate)))
        : ""
    const fieldClassName = `mt-2 w-full rounded-xl border ${palette.border} bg-black/35 px-4 py-3 font-semibold text-white placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70`

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="min-h-[calc(100dvh-7rem)] pb-28 pt-6 sm:pb-14 sm:pt-10">
                <div className="mx-auto max-w-5xl">
                    <Link to="/updates" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 font-bold text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                        <ArrowLeft size={19} aria-hidden="true" />
                        {t.updatesAdmin.backToUpdates}
                    </Link>

                    {loading && <div className={`mt-6 h-[38rem] animate-pulse rounded-2xl border ${palette.border} bg-black/25`} aria-label={t.updatesAdmin.loading} />}

                    {!loading && (loadError || notFound) && (
                        <GradientFrame glass glow className="mt-6" contentClassName="p-8 text-center sm:p-12">
                            <h1 className="text-3xl font-black text-white">{notFound ? t.updatesPage.notFoundTitle : t.updatesAdmin.loadError}</h1>
                            {!notFound && (
                                <button type="button" onClick={() => void loadUpdate()} className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 font-black ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                    <RefreshCw size={18} aria-hidden="true" />
                                    {t.updatesPage.retry}
                                </button>
                            )}
                        </GradientFrame>
                    )}

                    {!loading && !loadError && !notFound && (
                        <form onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-[0.16em] ${palette.accentText}`}>{editing ? t.updatesAdmin.editUpdate : t.updatesAdmin.newUpdate}</p>
                                    <h1 className="mt-2 text-3xl font-black text-white sm:text-5xl">{editing ? t.updatesAdmin.editUpdate : t.updatesAdmin.newUpdate}</h1>
                                </div>
                                <div className="inline-flex self-start rounded-full border border-white/15 bg-black/25 p-1" aria-label={t.updatesAdmin.editorMode}>
                                    {(["write", "preview"] as const).map(option => (
                                        <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)} className={`rounded-full px-5 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${mode === option ? `${palette.primaryButton} ${palette.primaryButtonText}` : "text-white/65 hover:text-white"}`}>
                                            {option === "write" ? t.updatesAdmin.write : t.updatesAdmin.preview}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <GradientFrame glass glow className="mt-7" contentClassName="p-5 sm:p-8 lg:p-10">
                                {mode === "write" ? (
                                    <div className="grid gap-6">
                                        <div className="grid gap-6 sm:grid-cols-2">
                                            <label className="font-black text-white">
                                                {t.updatesAdmin.version}
                                                <span className={`ml-2 inline-flex rounded-full px-3 py-1 text-xs ${palette.primaryButton} ${palette.primaryButtonText}`}>{version ? `Version ${version}` : "Version"}</span>
                                                <input value={version} onChange={event => setVersion(event.target.value)} maxLength={UPDATE_VERSION_MAX_LENGTH} className={fieldClassName} aria-invalid={Boolean(fieldErrors.version)} aria-describedby={fieldErrors.version ? "version-error" : undefined} />
                                                {fieldErrors.version && <span id="version-error" className="mt-2 block text-sm text-red-200">{fieldErrors.version}</span>}
                                            </label>
                                            <label className="font-black text-white">
                                                {t.updatesAdmin.publicationDate}
                                                <input type="date" value={publishedDate} onChange={event => setPublishedDate(event.target.value)} className={fieldClassName} aria-invalid={Boolean(fieldErrors.publishedDate)} aria-describedby={fieldErrors.publishedDate ? "date-error" : undefined} />
                                                {fieldErrors.publishedDate && <span id="date-error" className="mt-2 block text-sm text-red-200">{fieldErrors.publishedDate}</span>}
                                            </label>
                                        </div>
                                        <label className="font-black text-white">
                                            {t.updatesAdmin.title}
                                            <input value={title} onChange={event => setTitle(event.target.value)} maxLength={UPDATE_TITLE_MAX_LENGTH} className={fieldClassName} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "title-error" : undefined} />
                                            {fieldErrors.title && <span id="title-error" className="mt-2 block text-sm text-red-200">{fieldErrors.title}</span>}
                                        </label>
                                        <label className="font-black text-white">
                                            {t.updatesAdmin.content}
                                            <textarea value={content} onChange={event => setContent(event.target.value)} className={`${fieldClassName} min-h-[28rem] resize-y font-mono text-sm leading-7 sm:text-base`} aria-invalid={Boolean(fieldErrors.content)} aria-describedby={fieldErrors.content ? "content-error" : undefined} />
                                            {fieldErrors.content && <span id="content-error" className="mt-2 block text-sm text-red-200">{fieldErrors.content}</span>}
                                        </label>
                                    </div>
                                ) : (
                                    <article className="min-w-0">
                                        <p className={`break-words text-sm font-black uppercase tracking-[0.16em] ${palette.accentText}`}>Version {version || "—"}</p>
                                        {formattedPreviewDate && <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white/50"><CalendarDays size={16} aria-hidden="true" />{t.updatesPage.published} {formattedPreviewDate}</p>}
                                        <h2 className="mt-4 break-words text-3xl font-black text-white sm:text-5xl">{title || t.updatesAdmin.title}</h2>
                                        <div className="my-8 h-px bg-white/15" />
                                        {content ? <UpdateMarkdown content={content} /> : <p className="text-white/50">{t.updatesAdmin.previewEmpty}</p>}
                                    </article>
                                )}
                            </GradientFrame>

                            {submitError && <p role="alert" className="mt-5 rounded-xl bg-red-950/75 p-4 font-bold text-red-100">{submitError}</p>}
                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Link to="/updates" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 py-3 font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">{t.updatesAdmin.cancel}</Link>
                                <button type="submit" disabled={submitting} className={`min-h-12 rounded-full px-7 py-3 font-black shadow-xl transition disabled:cursor-wait disabled:opacity-60 ${palette.primaryButton} ${palette.primaryButtonText}`}>
                                    {submitting ? t.updatesAdmin.saving : editing ? t.updatesAdmin.saveChanges : t.updatesAdmin.publishUpdate}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </AppPageShell>
        </PageContentTransition>
    )
}
