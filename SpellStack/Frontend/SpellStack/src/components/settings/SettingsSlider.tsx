import type { PaletteTheme } from "../../theme/themes"

interface SettingsSliderProps {
    value: number
    onChange: (value: number) => void
    palette: PaletteTheme
    disabled?: boolean
    label: string
}

export default function SettingsSlider({ value, onChange, palette, disabled = false, label }: SettingsSliderProps) {
    const clampedValue = Math.min(100, Math.max(0, value))
    const muted = clampedValue === 0
    const fillOpacityClass = palette.id === "red" ? "opacity-70" : "opacity-85"
    const glowClass = palette.id === "red" ? "shadow-[0_0_12px_rgba(255,255,255,0.08)]" : "shadow-[0_0_18px_rgba(255,255,255,0.14)]"

    return (
        <div className={`w-full min-w-64 ${disabled ? "opacity-50" : ""}`}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                    {label}
                </span>
                <span className="relative min-w-14 overflow-hidden rounded-full px-3 py-1 text-center text-xs font-black text-white shadow-lg">
                    <span className={`absolute inset-0 ${muted ? "bg-white/10" : `${fillOpacityClass} ${palette.primaryButton}`}`} />
                    <span className={`relative ${muted ? "text-white/55" : "text-white"}`}>
                        {clampedValue}%
                    </span>
                </span>
            </div>

            <div className="relative h-9">
                <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.55)]" />

                <div
                    className={`absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-full ${glowClass} ${fillOpacityClass} ${palette.primaryButton}`}
                    style={{ width: `${clampedValue}%` }}
                />

                <div className="pointer-events-none absolute inset-x-2 top-1/2 grid -translate-y-1/2 grid-cols-5">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <span
                            key={index}
                            className="mx-auto h-1.5 w-1.5 rounded-full bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.24)]"
                        />
                    ))}
                </div>

                <div
                    className="pointer-events-none absolute top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 bg-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.45),0_0_18px_rgba(255,255,255,0.18)]"
                    style={{ left: `${clampedValue}%` }}
                >
                    <span className={`h-3 w-3 rounded-full ${muted ? "bg-white/35" : `${fillOpacityClass} ${palette.primaryButton}`}`} />
                </div>

                <input
                    type="range"
                    min={0}
                    max={100}
                    value={clampedValue}
                    disabled={disabled}
                    onChange={event => onChange(Number(event.target.value))}
                    aria-label={label}
                    className="absolute inset-0 h-9 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
            </div>
        </div>
    )
}