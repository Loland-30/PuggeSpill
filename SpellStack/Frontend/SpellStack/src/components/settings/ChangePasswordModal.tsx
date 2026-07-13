import { useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Save, X } from "lucide-react"

import { useI18n } from "../../i18n/I18nContext"
import type { PaletteTheme } from "../../theme/themes"

export interface PasswordChangeRequest {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (request: PasswordChangeRequest) => Promise<string | void>
    palette: PaletteTheme
}

export default function ChangePasswordModal({ isOpen, onClose, onSave, palette }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const { t } = useI18n()
    const copy = t.passwordModal

    const resetFields = () => {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setError("")
        setIsSaving(false)
    }

    const closeModal = () => {
        onClose()
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError(copy.fillAllError)
            return
        }

        if (newPassword !== confirmPassword) {
            setError(copy.mismatchError)
            return
        }

        setIsSaving(true)
        setError("")

        try {
            await onSave({ currentPassword, newPassword, confirmPassword })
            closeModal()
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : ""
            setError(message || copy.genericError)
        } finally {
            setIsSaving(false)
        }
    }

    const inputClassName = `w-full rounded-2xl border ${palette.border} bg-slate-950/90 px-4 py-3 text-sm font-bold text-white placeholder:text-white/35 outline-none backdrop-blur transition focus:ring-2 focus:ring-white/20`

    return (
        <AnimatePresence onExitComplete={resetFields}>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[1000] grid place-items-center overflow-y-auto bg-black/65 px-3 py-4 backdrop-blur-sm sm:px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                >
                    <motion.form
                        onSubmit={handleSubmit}
                        className={`relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border ${palette.border} ${palette.card} ${palette.glow} p-4 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6`}
                        initial={{ opacity: 0, scale: 0.86, y: 18 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 12 }}
                        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.75 }}
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            disabled={isSaving}
                            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/15"
                            aria-label={copy.closeLabel}
                        >
                            <X size={20} strokeWidth={2.6} />
                        </button>

                        <div className="pr-12">
                            <p className={`text-xs font-black uppercase tracking-[0.28em] ${palette.accentText}`}>{copy.kicker}</p>
                            <h2 className="mt-3 text-3xl font-black text-white">{copy.title}</h2>
                            <p className="mt-2 text-sm leading-6 text-white/60">
                                {copy.description}
                            </p>
                        </div>

                        <div className="mt-7 space-y-4">
                            <label className="block">
                                <span className="text-sm font-black text-white">{copy.currentPassword}</span>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={event => {
                                        setError("")
                                        setCurrentPassword(event.target.value)
                                    }}
                                    className={`${inputClassName} mt-2`}
                                    placeholder={copy.currentPasswordPlaceholder}
                                    autoComplete="current-password"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-black text-white">{copy.newPassword}</span>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={event => {
                                        setError("")
                                        setNewPassword(event.target.value)
                                    }}
                                    className={`${inputClassName} mt-2`}
                                    placeholder={copy.newPasswordPlaceholder}
                                    autoComplete="new-password"
                                />
                            </label>

                            <label className="block">
                                <span className="text-sm font-black text-white">{copy.confirmPassword}</span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={event => {
                                        setError("")
                                        setConfirmPassword(event.target.value)
                                    }}
                                    className={`${inputClassName} mt-2`}
                                    placeholder={copy.confirmPasswordPlaceholder}
                                    autoComplete="new-password"
                                />
                            </label>
                        </div>

                        {error && <p className="mt-4 text-sm font-bold text-red-300">{error}</p>}

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                            type="button"
                            onClick={closeModal}
                            disabled={isSaving}
                            className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
                        >
                                {copy.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5 ${palette.primaryButton} ${palette.primaryButtonText}`}
                            >
                                <Save size={18} strokeWidth={2.6} />
                                {isSaving ? copy.saving : copy.savePassword}
                            </button>
                        </div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
