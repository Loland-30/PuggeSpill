import { useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

import type { UpdateListItem } from "../../api/updates"
import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"

interface UpdateDeleteModalProps {
    update: UpdateListItem | null
    deleting: boolean
    error: string
    onCancel: () => void
    onConfirm: () => void
}

export default function UpdateDeleteModal({ update, deleting, error, onCancel, onConfirm }: UpdateDeleteModalProps) {
    const { t } = useI18n()
    const { palette } = useTheme()
    const reduceMotion = useReducedMotion()
    const cancelButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!update) return

        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
        cancelButtonRef.current?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !deleting) onCancel()
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            previouslyFocused?.focus()
        }
    }, [deleting, onCancel, update])

    return (
        <AnimatePresence>
            {update && (
                <motion.div
                    className="fixed inset-0 z-[1300] grid place-items-center bg-black/75 px-4"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    onMouseDown={event => {
                        if (event.target === event.currentTarget && !deleting) onCancel()
                    }}
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-update-title"
                        aria-describedby="delete-update-description"
                        className={`w-full max-w-lg rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-6 shadow-2xl sm:p-8`}
                        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
                    >
                        <AlertTriangle className="text-red-300" size={32} aria-hidden="true" />
                        <h2 id="delete-update-title" className="mt-4 text-2xl font-black text-white">{t.updatesAdmin.deleteTitle}</h2>
                        <p id="delete-update-description" className="mt-3 break-words font-medium leading-7 text-white/70">
                            {t.updatesAdmin.deleteDescription.replace("{title}", `“${update.title}”`)}
                        </p>
                        <p className="mt-2 text-sm font-bold text-red-200/80">{t.updatesAdmin.cannotUndo}</p>
                        {error && <p role="alert" className="mt-4 rounded-lg bg-red-950/70 p-3 text-sm font-bold text-red-100">{error}</p>}
                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button ref={cancelButtonRef} type="button" onClick={onCancel} disabled={deleting} className="rounded-full border border-white/20 bg-white/5 px-5 py-3 font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50">
                                {t.updatesAdmin.cancel}
                            </button>
                            <button type="button" onClick={onConfirm} disabled={deleting} aria-busy={deleting} className="rounded-full bg-red-600 px-6 py-3 font-black text-white shadow-lg transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:cursor-wait disabled:opacity-60">
                                {deleting ? t.updatesAdmin.deleting : t.updatesAdmin.deleteUpdate}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
