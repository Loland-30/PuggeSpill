import type { ActiveGameModifier } from "../../api/gameSession"
import { useTheme } from "../../theme/ThemeContext"
import type { ModifierDefinition } from "./modifierData"

interface Props {
    modifier: ModifierDefinition
    selected: boolean
    onToggle: (modifier: ActiveGameModifier) => void
}

export default function ModifierCard({ modifier, selected, onToggle }: Props) {
    const { palette } = useTheme()

    return (
        <button
            type="button"
            onClick={() => onToggle(modifier.id)}
            className={`group rounded-2xl border p-5 text-center transition hover:-translate-y-1 ${
                selected
                    ? `${palette.border} ${palette.card} ${palette.glow}`
                    : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.08]"
            }`}
        >
            <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full border text-2xl font-black transition ${
                selected
                    ? `${palette.border} ${palette.primaryButton} ${palette.primaryButtonText}`
                    : "border-white/60 text-white group-hover:bg-white group-hover:text-slate-950"
            }`}>
                {modifier.icon}
            </div>

            <p className={`mt-4 text-sm font-black uppercase tracking-[0.2em] ${selected ? palette.accentText : "text-white/80"}`}>
                {modifier.name}
            </p>

            <p className="mt-2 text-sm font-medium text-white/55">
                {modifier.shortDescription}
            </p>

            <p className="mt-3 text-xs leading-relaxed text-white/35">
                {modifier.longDescription}
            </p>
        </button>
    )
}
