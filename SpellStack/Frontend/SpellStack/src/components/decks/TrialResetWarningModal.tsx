import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"

import { useI18n } from "../../i18n/I18nContext"
import { useTheme } from "../../theme/ThemeContext"

interface TrialResetWarningModalProps {
    isOpen: boolean
    isSaving: boolean
    onCancel: () => void
    onConfirm: () => void
}

export default function TrialResetWarningModal({ isOpen, isSaving, onCancel, onConfirm }: TrialResetWarningModalProps) {
    const { palette } = useTheme()
    const { t } = useI18n()

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[1200] grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="presentation"
                >
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="trial-reset-title"
                        className={`w-full max-w-lg rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-6 shadow-2xl sm:rounded-3xl sm:p-8`}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    >
                        <AlertTriangle size={32} className={palette.accentText} aria-hidden="true" />
                        <h2 id="trial-reset-title" className="mt-4 text-2xl font-black text-white">
                            {t.trials.resetWarningTitle}
                        </h2>
                        <p className="mt-3 text-sm font-medium leading-6 text-white/65">
                            {t.trials.resetWarningBody}
                        </p>
                        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isSaving}
                                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isSaving}
                                className={`rounded-full px-6 py-3 text-sm font-black shadow-xl transition ${palette.primaryButton} ${palette.primaryButtonText}`}
                            >
                                {t.trials.saveAndReset}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
