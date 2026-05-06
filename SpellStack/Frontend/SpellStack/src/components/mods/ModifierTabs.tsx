import type { ModifierCategory } from "./modifierData"

interface Props {
    activeCategory: ModifierCategory
    onChange: (category: ModifierCategory) => void
}

export default function ModifierTabs({ activeCategory, onChange }: Props) {
    return (
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <button
                type="button"
                onClick={() => onChange("easier")}
                className={`
                    flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-black transition
                    ${
                        activeCategory === "easier"
                            ? "bg-white/15 text-white shadow-lg"
                            : "text-white/50 hover:bg-white/10 hover:text-white"
                    }
                `}
            >
                <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-xs">
                    +
                </span>
                Easier
            </button>

            <button
                type="button"
                onClick={() => onChange("harder")}
                className={`
                    flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-black transition
                    ${
                        activeCategory === "harder"
                            ? "bg-orange-400 text-white shadow-lg shadow-orange-500/20"
                            : "text-white/50 hover:bg-orange-400/10 hover:text-white"
                    }
                `}
            >
                <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-xs">
                    !
                </span>
                Harder
            </button>
        </div>
    )
}