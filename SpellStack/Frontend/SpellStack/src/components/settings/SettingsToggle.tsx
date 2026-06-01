import { useUISound } from "../../audio/useUISound"
import type { PaletteTheme } from "../../theme/themes"

interface SettingsToggleProps {
    checked: boolean
    onChange: (checked: boolean) => void
    palette: PaletteTheme
    disabled?: boolean
    label: string
}

export default function SettingsToggle({ checked, onChange, palette, disabled = false, label }: SettingsToggleProps) {
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!checked)}
            onMouseEnter={playHoverSound}
            disabled={disabled}
            className={`relative h-9 w-16 rounded-full border transition ${
                checked ? `${palette.border} ${palette.primaryButton}` : "border-white/20 bg-black/30"
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            aria-pressed={checked}
            aria-label={label}
        >
            <span
                className={`absolute top-1 grid h-7 w-7 place-items-center rounded-full bg-white shadow-lg transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`}
            />
        </button>
    )
}
