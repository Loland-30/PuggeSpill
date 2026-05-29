import { useEffect, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, X } from "lucide-react"

import type { PaletteTheme } from "../../theme/themes"

interface JoinRoomModalProps {
    isOpen: boolean
    onClose: () => void
    onJoin: (roomCode: string) => void
    palette: PaletteTheme
}

export default function JoinRoomModal({ isOpen, onClose, onJoin, palette }: JoinRoomModalProps) {
    const [roomCode, setRoomCode] = useState("")

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) setRoomCode("")
    }, [isOpen])

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const normalizedCode = roomCode.trim().toUpperCase()
        if (!normalizedCode) return

        onJoin(normalizedCode)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[900] grid place-items-center bg-black/55 px-6 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    onMouseDown={onClose}
                >
                    <motion.form
                        onSubmit={handleSubmit}
                        onMouseDown={event => event.stopPropagation()}
                        className={`relative w-full max-w-xl rounded-[2rem] border ${palette.border} ${palette.card} ${palette.glow} p-8 shadow-2xl backdrop-blur-xl`}
                        initial={{ opacity: 0, scale: 0.94, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
                            aria-label="Close join room modal"
                        >
                            <X size={22} strokeWidth={2.6} />
                        </button>

                        <h2 className="pr-12 text-3xl font-black text-white">Enter room code</h2>

                        <div className={`mt-8 flex items-center gap-3 rounded-2xl border ${palette.border} bg-slate-950/70 px-5 py-4 shadow-inner focus-within:ring-2 focus-within:ring-white/20`}>
                            <input
                                value={roomCode}
                                onChange={event => setRoomCode(event.target.value.toUpperCase())}
                                className="min-w-0 flex-1 bg-transparent text-2xl font-black uppercase tracking-wide text-white outline-none placeholder:text-white/30"
                                placeholder="T6@XA2"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!roomCode.trim()}
                                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${palette.primaryButton} ${palette.primaryButtonText}`}
                                aria-label="Join room"
                            >
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <p className="mt-4 min-h-5 text-sm font-semibold text-white/45">
                            Mock rooms accept any non-empty code for now.
                        </p>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
