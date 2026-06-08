import { Check, Music2, Play } from "lucide-react"
import type { ReactNode } from "react"

import { hoverAudioPresets } from "../../audio/audioPresets"
import { useAudioPreview } from "../../audio/useAudioPreview"
import { useUISound } from "../../audio/useUISound"
import { useTheme } from "../../theme/ThemeContext"
import type { AudioPresetKey } from "../../theme/themes"
import CustomAudioThemePanel from "./CustomAudioThemePanel"

export default function AudioThemePanel() {
    const { theme, palette, setAudioPreset } = useTheme()
    const { playPreset } = useAudioPreview()
    const { playHoverSound } = useUISound()

    const handleHoverSoundChange = (value: AudioPresetKey | null) => {
        setAudioPreset("hoverSound", value)
    }

    return (
        <div className="space-y-8">
            <AudioPanel title="Interface sounds" icon={<Play size={22} strokeWidth={2.5} />}>
                <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-white/50">Hover effect</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {hoverAudioPresets.map(preset => {
                            const selected = theme.audio.hoverSound === preset.key

                            return (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => handleHoverSoundChange(preset.key)}
                                    onMouseEnter={playHoverSound}
                                    className={`rounded-2xl border p-4 text-left transition ${
                                        selected ? `${palette.border} ${palette.card} ${palette.glow}` : "border-white/10 bg-white/[0.04] hover:border-white/35"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-black text-white">{preset.displayName}</p>
                                            <p className="mt-1 text-sm font-semibold text-white/50">Soft UI hover feedback.</p>
                                        </div>
                                        {selected && <Check size={20} strokeWidth={3} />}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={event => {
                                            event.stopPropagation()
                                            playPreset(preset.key)
                                        }}
                                        disabled={!theme.audio.audioEnabled || theme.audio.uiVolume <= 0}
                                        onMouseEnter={playHoverSound}
                                        className={`mt-5 rounded-full px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${palette.primaryButton} ${palette.primaryButtonText}`}
                                    >
                                        Preview
                                    </button>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <ComingSoonGrid items={["Click sound", "Success sound", "Error sound"]} />
            </AudioPanel>

            <AudioPanel title="Music" icon={<Music2 size={22} strokeWidth={2.5} />}>
                <ComingSoonGrid items={["In-game music"]} />
            </AudioPanel>

            <CustomAudioThemePanel />
        </div>
    )
}

function AudioPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    const { palette } = useTheme()

    return (
        <section className={`rounded-[2rem] border ${palette.border} ${palette.card} p-6 shadow-2xl backdrop-blur-xl`}>
            <div className="mb-6 flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    {icon}
                </span>
                <h2 className="text-2xl font-black text-white">{title}</h2>
            </div>
            <div className="space-y-5">
                {children}
            </div>
        </section>
    )
}

function ComingSoonGrid({ items }: { items: string[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {items.map(item => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 opacity-65">
                    <p className="font-black text-white">{item}</p>
                    <p className="mt-1 text-sm font-semibold text-white/42">Coming soon</p>
                </div>
            ))}
        </div>
    )
}
