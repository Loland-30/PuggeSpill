import { Music2, Pause, Play, RotateCcw, Upload } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react"

import { audioPreviewStoppedEvent } from "../../audio/audioEvents"
import { useAudioPreview } from "../../audio/useAudioPreview"
import { useUISound } from "../../audio/useUISound"
import { useAuth } from "../../auth/AuthContext"
import { useTheme } from "../../theme/ThemeContext"
import { resolveAssetUrl } from "../../utils/assetUrl"

const allowedExtensions = [".mp3", ".wav", ".ogg", ".m4a"]
const allowedMimeTypes = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/x-mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/vnd.wave",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a"
])

export default function CustomAudioThemePanel() {
    const { theme, palette } = useTheme()
    const {
        user,
        uploadLoginSplashSound,
        deleteLoginSplashSound,
        uploadMainMenuMusic,
        deleteMainMenuMusic
    } = useAuth()
    const { playUrl, stopPreview } = useAudioPreview()

    return (
        <section className={`rounded-[2rem] border ${palette.border} ${palette.card} p-6 shadow-2xl backdrop-blur-xl`}>
            <div className="mb-6 flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    <Music2 size={22} strokeWidth={2.5} />
                </span>
                <h2 className="text-2xl font-black text-white">Custom account audio</h2>
            </div>

            <div className="space-y-5">
                <CustomAudioRow
                    title="Custom login splash sound"
                    description="Played on the welcome splash after sign-in."
                    maxBytes={3 * 1024 * 1024}
                    currentUrl={user?.customLoginSplashSoundUrl}
                    previewVolume={theme.audio.uiVolume}
                    audioEnabled={theme.audio.audioEnabled}
                    onUpload={uploadLoginSplashSound}
                    onReset={deleteLoginSplashSound}
                    onPreview={url => playUrl(url, theme.audio.uiVolume)}
                    onStopPreview={stopPreview}
                />
                <CustomAudioRow
                    title="Custom main menu background music"
                    description="Loops while you browse the main app."
                    maxBytes={10 * 1024 * 1024}
                    currentUrl={user?.customMainMenuMusicUrl}
                    previewVolume={theme.audio.musicVolume}
                    audioEnabled={theme.audio.audioEnabled}
                    onUpload={uploadMainMenuMusic}
                    onReset={deleteMainMenuMusic}
                    onPreview={url => playUrl(url, theme.audio.musicVolume)}
                    onStopPreview={stopPreview}
                />
            </div>
        </section>
    )
}

function CustomAudioRow({
    title,
    description,
    maxBytes,
    currentUrl,
    previewVolume,
    audioEnabled,
    onUpload,
    onReset,
    onPreview,
    onStopPreview
}: {
    title: string
    description: string
    maxBytes: number
    currentUrl?: string | null
    previewVolume: number
    audioEnabled: boolean
    onUpload: (file: File) => Promise<unknown>
    onReset: () => Promise<unknown>
    onPreview: (url: string) => void
    onStopPreview: () => void
}) {
    const { playHoverSound } = useUISound()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [busy, setBusy] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const [error, setError] = useState("")
    const resolvedUrl = resolveAssetUrl(currentUrl)
    const maxMegabytes = maxBytes / (1024 * 1024)

    useEffect(() => {
        const handlePreviewStopped = () => setPreviewing(false)
        window.addEventListener(audioPreviewStoppedEvent, handlePreviewStopped)
        return () => window.removeEventListener(audioPreviewStoppedEvent, handlePreviewStopped)
    }, [])

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        event.target.value = ""
        if (!file) return

        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
        if (!allowedExtensions.includes(extension) || (file.type && !allowedMimeTypes.has(file.type))) {
            setError("Only MP3, WAV, OGG and M4A audio files are allowed.")
            return
        }
        if (file.size > maxBytes) {
            setError(`The file must be ${maxMegabytes} MB or smaller.`)
            return
        }

        setBusy(true)
        setError("")
        onStopPreview()
        setPreviewing(false)
        try {
            await onUpload(file)
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Could not upload the audio file.")
        } finally {
            setBusy(false)
        }
    }

    const handleReset = async () => {
        setBusy(true)
        setError("")
        onStopPreview()
        setPreviewing(false)
        try {
            await onReset()
        } catch (resetError) {
            setError(resetError instanceof Error ? resetError.message : "Could not reset the audio file.")
        } finally {
            setBusy(false)
        }
    }

    const handlePreview = () => {
        if (!resolvedUrl || !audioEnabled || previewVolume <= 0) return
        if (previewing) {
            onStopPreview()
            setPreviewing(false)
            return
        }

        onPreview(resolvedUrl)
        setPreviewing(true)
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="font-black text-white">{title}</p>
                    <p className="mt-1 text-sm font-semibold text-white/48">{description}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-white/38">
                        {resolvedUrl ? "Custom upload active" : "Using default audio"} · Max {maxMegabytes} MB
                    </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/mp4"
                        onChange={handleFileChange}
                        className="sr-only"
                    />
                    <AudioActionButton
                        label={busy ? "Uploading..." : "Upload"}
                        icon={<Upload size={16} />}
                        disabled={busy}
                        onClick={() => inputRef.current?.click()}
                    />
                    <AudioActionButton
                        label={previewing ? "Stop" : "Preview"}
                        icon={previewing ? <Pause size={16} /> : <Play size={16} />}
                        disabled={!resolvedUrl || busy || !audioEnabled || previewVolume <= 0}
                        onClick={handlePreview}
                    />
                    <AudioActionButton
                        label="Reset"
                        icon={<RotateCcw size={16} />}
                        disabled={!resolvedUrl || busy}
                        onClick={handleReset}
                    />
                </div>
            </div>

            {error && <p className="mt-3 text-sm font-bold text-rose-300">{error}</p>}
            {!audioEnabled && <p className="mt-3 text-sm font-semibold text-white/42">Enable audio in Settings to preview files.</p>}
        </div>
    )

    function AudioActionButton({
        label,
        icon,
        disabled,
        onClick
    }: {
        label: string
        icon: ReactNode
        disabled: boolean
        onClick: () => void
    }) {
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onClick}
                onMouseEnter={disabled ? undefined : playHoverSound}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-black transition ${
                    disabled
                        ? "cursor-not-allowed border-white/5 bg-white/5 text-white/25"
                        : "border-white/10 bg-white/[0.07] text-white hover:bg-white/12"
                }`}
            >
                {icon}
                {label}
            </button>
        )
    }
}
