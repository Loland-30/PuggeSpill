import type { ActiveGameModifier } from "../../api/gameSession"
import type { ModifierDefinition } from "./modifierData"

interface Props {
    modifier: ModifierDefinition
    selected: boolean
    onToggle: (modifier: ActiveGameModifier) => void
}

export default function ModifierCard({ modifier, selected, onToggle }: Props) {
    return (
        <button
            type="button"
            onClick={() => onToggle(modifier.id)}
            className={`
                group rounded-2xl border p-5 text-center transition hover:-translate-y-1
                ${
                    selected
                        ? "border-orange-300 bg-orange-400/20 shadow-[0_0_28px_rgba(251,146,60,0.22)]"
                        : "border-white/10 bg-white/[0.04] hover:border-orange-300/80 hover:bg-orange-400/10"
                }
            `}
        >
            <div
                className={`
                    mx-auto grid h-14 w-14 place-items-center rounded-full border text-2xl font-black transition
                    ${
                        selected
                            ? "border-orange-200 bg-orange-400 text-white"
                            : "border-orange-300/80 text-orange-300 group-hover:bg-orange-400 group-hover:text-white"
                    }
                `}
            >
                {modifier.icon}
            </div>

            <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-orange-200">
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