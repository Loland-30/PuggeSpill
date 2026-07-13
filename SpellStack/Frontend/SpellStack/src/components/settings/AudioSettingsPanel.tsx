import { Volume2 } from "lucide-react"
import type { ReactNode } from "react"

import { useUISound } from "../../audio/useUISound"
import { useTheme } from "../../theme/ThemeContext"

export default function AudioSettingsPanel() {
    const { theme, setAudioEnabled, setUiVolume, setMusicVolume } = useTheme()

    return (
        <AudioPanel title="Master" icon={<Volume2 size={22} strokeWidth={2.5} />}>
            <ToggleRow
                title="Enable audio"
                description="Controls interface sounds, splash audio and music."
                checked={theme.audio.audioEnabled}
                onChange={setAudioEnabled}
            />
            <VolumeRow title="UI volume" value={theme.audio.uiVolume} onChange={setUiVolume} />
            <VolumeRow title="Music volume" value={theme.audio.musicVolume} onChange={setMusicVolume} />
        </AudioPanel>
    )
}

function AudioPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    const { palette } = useTheme()

    return (
        <section className={`rounded-2xl border ${palette.border} ${palette.card} p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-6`}>
            <div className="mb-6 flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    {icon}
                </span>
                <h2 className="text-2xl font-black text-white">{title}</h2>
            </div>
            <div className="space-y-5">{children}</div>
        </section>
    )
}

function ToggleRow({ title, description, checked, onChange }: {
    title: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()

    return (
        <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm font-semibold text-white/48">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                onMouseEnter={playHoverSound}
                className={`relative h-8 w-14 rounded-full transition ${checked ? palette.primaryButton : "bg-white/15"}`}
                aria-pressed={checked}
            >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? "left-7" : "left-1"}`} />
            </button>
        </div>
    )
}

function VolumeRow({ title, value, onChange }: {
    title: string
    value: number
    onChange: (value: number) => void
}) {
    const { palette } = useTheme()
    const percent = Math.round(value * 100)

    return (
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-black text-white">{title}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    {percent}%
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={event => onChange(Number(event.target.value) / 100)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-current"
            />
        </div>
    )
}
