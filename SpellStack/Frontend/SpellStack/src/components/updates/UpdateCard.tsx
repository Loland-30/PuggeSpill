import { ArrowRight, CalendarDays, Pencil, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import type { UpdateListItem } from "../../api/updates"
import { useTheme } from "../../theme/ThemeContext"
import { useI18n } from "../../i18n/I18nContext"
import GradientFrame from "../GradientFrame"

function formatPublishedDate(value: string | null, locale: string) {
    if (!value) return null
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value))
}

interface UpdateCardProps {
    update: UpdateListItem
    locale: string
    featured?: boolean
    readMoreLabel?: string
    onEdit?: (update: UpdateListItem) => void
    onDelete?: (update: UpdateListItem) => void
}

export default function UpdateCard({ update, locale, featured = false, readMoreLabel, onEdit, onDelete }: UpdateCardProps) {
    const { palette } = useTheme()
    const { t } = useI18n()
    const publishedDate = formatPublishedDate(update.publishedAt, locale)
    const hasAdminActions = Boolean(onEdit || onDelete)

    return (
        <div className="group relative h-full min-w-0">
            <Link
                to={`/updates/${update.slug}`}
                className="block h-full min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/75"
            >
                <GradientFrame
                    glass
                    glow={featured}
                    className="h-full transition duration-200 group-hover:-translate-y-1"
                    contentClassName={`h-full p-5 sm:p-7 ${hasAdminActions ? "pb-20" : ""}`}
                    hoverFillClassName="group-hover/gradient-frame:bg-white/[0.035]"
                >
                    <article className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className={`text-sm font-black uppercase tracking-[0.2em] ${palette.accentText}`}>{update.version}</p>
                            <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">{update.title}</h2>
                            <p className="mt-3 max-w-2xl break-words text-sm font-medium leading-6 text-white/65 sm:text-base sm:leading-7">{update.summary}</p>
                        </div>

                        <div className="flex shrink-0 items-end justify-between gap-4 sm:min-h-36 sm:flex-col sm:items-end">
                            {publishedDate && <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold text-white/50 sm:text-sm"><CalendarDays size={16} aria-hidden="true" />{publishedDate}</span>}
                            {readMoreLabel && !hasAdminActions && <span className="inline-flex items-center gap-2 text-sm font-black text-white transition group-hover:gap-3">{readMoreLabel}<ArrowRight size={18} aria-hidden="true" /></span>}
                        </div>
                    </article>
                </GradientFrame>
            </Link>

            {hasAdminActions && (
                <div className="absolute bottom-4 right-4 z-20 flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    {onEdit && (
                        <button type="button" onClick={() => onEdit(update)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-black/60 px-3 text-sm font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                            <Pencil size={18} aria-hidden="true" />
                            <span className="hidden md:inline">{t.updatesAdmin.editUpdate}</span>
                        </button>
                    )}
                    {onDelete && (
                        <button type="button" onClick={() => onDelete(update)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-950/80 px-3 text-sm font-black text-red-100 transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200">
                            <Trash2 size={18} aria-hidden="true" />
                            <span className="hidden md:inline">{t.updatesAdmin.deleteUpdate}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
