import { ArrowRight, CalendarDays } from "lucide-react"
import { Link } from "react-router-dom"

import type { UpdateListItem } from "../../api/updates"
import { useTheme } from "../../theme/ThemeContext"
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
}

export default function UpdateCard({ update, locale, featured = false, readMoreLabel }: UpdateCardProps) {
    const { palette } = useTheme()
    const publishedDate = formatPublishedDate(update.publishedAt, locale)

    return (
        <Link
            to={`/updates/${update.slug}`}
            className="group block h-full min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/75"
        >
            <GradientFrame
                glass
                glow={featured}
                className="h-full transition duration-200 group-hover:-translate-y-1"
                contentClassName="h-full p-5 sm:p-7"
                hoverFillClassName="group-hover/gradient-frame:bg-white/[0.035]"
            >
                <article className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className={`text-sm font-black uppercase tracking-[0.2em] ${palette.accentText}`}>
                            {update.version}
                        </p>
                        <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">
                            {update.title}
                        </h2>
                        <p className="mt-3 max-w-2xl break-words text-sm font-medium leading-6 text-white/65 sm:text-base sm:leading-7">
                            {update.summary}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-end justify-between gap-4 sm:min-h-36 sm:flex-col sm:items-end">
                        {publishedDate && (
                            <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-bold text-white/50 sm:text-sm">
                                <CalendarDays size={16} aria-hidden="true" />
                                {publishedDate}
                            </span>
                        )}
                        {readMoreLabel && (
                            <span className="inline-flex items-center gap-2 text-sm font-black text-white transition group-hover:gap-3">
                                {readMoreLabel}
                                <ArrowRight size={18} aria-hidden="true" />
                            </span>
                        )}
                    </div>
                </article>
            </GradientFrame>
        </Link>
    )
}
