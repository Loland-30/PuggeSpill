import { useMemo, useState } from "react"
import { ArrowLeft, Check, Heart, Leaf, RotateCcw, ShieldAlert, X, Zap, type LucideIcon } from "lucide-react"
import type { ActiveGameModifier } from "../../api/gameSession"
import { useTheme } from "../../theme/ThemeContext"
import type { ModifierCategory, ModifierDefinition } from "./modifierData"
import { MODIFIER_DEFINITIONS } from "./modifierData"
import { getModifierDefinition, getModifierScoreMultiplier, toggleModifier } from "./modifierUtils"

interface Props {
    selectedModifiers: ActiveGameModifier[]
    onChange: (modifiers: ActiveGameModifier[]) => void
    onClose: () => void
}

const modifierIcons: Record<string, LucideIcon> = {
    extraHeart: Heart,
    zen: Leaf,
    hardcore: ShieldAlert,
    momentum: Zap
}

export default function ModifierPicker({ selectedModifiers, onChange, onClose }: Props) {
    const [activeCategory, setActiveCategory] = useState<ModifierCategory>("easier")
    const { palette } = useTheme()

    const visibleModifiers = useMemo(() => {
        return MODIFIER_DEFINITIONS.filter(modifier => modifier.category === activeCategory)
    }, [activeCategory])
    const selectedDefinitions = selectedModifiers
        .map(modifier => getModifierDefinition(modifier))
        .filter((modifier): modifier is ModifierDefinition => Boolean(modifier))
    const scoreMultiplier = getModifierScoreMultiplier(selectedModifiers)
    const hasZen = selectedModifiers.includes("zen")

    function handleToggle(modifier: ActiveGameModifier) {
        onChange(toggleModifier(selectedModifiers, modifier))
    }

    function removeModifier(modifier: ActiveGameModifier) {
        onChange(selectedModifiers.filter(selectedModifier => selectedModifier !== modifier))
    }

    return (
        <div className="flex min-h-[86vh] w-full max-w-[112rem] flex-col px-4 py-4 sm:px-8">
            <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-start">
                <div>
                    <h2 className="text-6xl font-black tracking-tight text-white sm:text-7xl">Mods</h2>
                    <p className="mt-2 text-2xl font-medium text-white/85">Customize your run.</p>
                </div>

                <div className="flex items-center justify-center gap-16 pt-2 text-2xl font-medium text-white/80">
                    <ModifierTab
                        active={activeCategory === "easier"}
                        label="Easier"
                        onClick={() => setActiveCategory("easier")}
                        accentClass={palette.border}
                    />
                    <ModifierTab
                        active={activeCategory === "harder"}
                        label="Harder"
                        onClick={() => setActiveCategory("harder")}
                        accentClass={palette.border}
                    />
                </div>

                <div className="flex justify-start lg:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`inline-flex items-center gap-2 rounded-2xl border ${palette.border} ${palette.card} px-5 py-3 text-2xl font-black text-white shadow-xl transition hover:brightness-110 ${palette.glow}`}
                    >
                        <ArrowLeft size={22} strokeWidth={3} />
                        Back
                    </button>
                </div>
            </div>

            <div className="grid flex-1 gap-10 xl:grid-cols-[minmax(0,1fr)_34.5rem]">
                <section className="rounded-[2rem] border border-white/[0.04] bg-[#25252f]/95 p-6 shadow-2xl sm:p-8 xl:min-h-[34rem]">
                    <div className="grid content-start justify-start justify-items-stretch gap-[18px] grid-cols-1 md:grid-cols-[repeat(2,minmax(190px,240px))] 2xl:grid-cols-[repeat(3,minmax(190px,240px))]">
                        {visibleModifiers.map(modifier => (
                            <ModifierCard
                                key={modifier.id}
                                modifier={modifier}
                                selected={selectedModifiers.includes(modifier.id)}
                                onToggle={handleToggle}
                                palette={palette}
                            />
                        ))}
                    </div>
                </section>

                <aside className="flex flex-col justify-start gap-6 rounded-[2rem] border border-white/[0.04] bg-[#25252f]/95 px-7 py-10 shadow-2xl sm:px-12 sm:py-14 xl:min-h-[34rem]">
                    <div className="text-left">
                        <p className="text-3xl font-medium text-white/90">Score multiplier</p>
                        <p className="mt-6 text-8xl font-black tracking-tight text-white sm:text-9xl xl:text-[9rem]">
                            {scoreMultiplier === 0 ? "0.00" : scoreMultiplier.toFixed(2)}<span className="text-7xl sm:text-8xl xl:text-9xl">x</span>
                        </p>
                        {hasZen && (
                            <p className="mt-3 text-sm font-bold text-white/50">Zen disables score.</p>
                        )}
                    </div>

                    <div className="my-4 h-px bg-white/35" />

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="text-3xl font-medium text-white">Selected mods</h3>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            disabled={selectedModifiers.length === 0}
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white/85 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <RotateCcw size={15} strokeWidth={2.5} />
                            Clear mods
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4">
                        {selectedDefinitions.length === 0 ? (
                            <p className="text-lg font-medium text-white/45">No mods selected</p>
                        ) : selectedDefinitions.map(modifier => (
                            <button
                                key={modifier.id}
                                type="button"
                                onClick={() => removeModifier(modifier.id)}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-xl font-medium shadow-lg transition hover:scale-[1.03] ${palette.primaryButton} ${palette.primaryButtonText}`}
                                aria-label={`Remove ${modifier.name}`}
                            >
                                {modifier.name}
                                <X size={18} strokeWidth={2.6} />
                            </button>
                        ))}
                    </div>
                </aside>
            </div>
        </div>
    )
}

function ModifierTab({ active, label, onClick, accentClass }: {
    active: boolean
    label: string
    onClick: () => void
    accentClass: string
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`border-b pb-2 transition ${active ? `${accentClass} text-white` : "border-transparent text-white/70 hover:text-white"}`}
        >
            {label}
        </button>
    )
}

function ModifierCard({ modifier, selected, onToggle, palette }: {
    modifier: ModifierDefinition
    selected: boolean
    onToggle: (modifier: ActiveGameModifier) => void
    palette: ReturnType<typeof useTheme>["palette"]
}) {
    const Icon = modifierIcons[modifier.id] ?? Zap

    return (
        <button
            type="button"
            onClick={() => onToggle(modifier.id)}
            className={`group relative flex min-h-[235px] w-full flex-col items-center justify-between rounded-2xl border px-[18px] py-[22px] text-center transition hover:bg-white/[0.08] ${
                selected
                    ? `${palette.border} ${palette.card} ${palette.glow}`
                    : "border-white/10 bg-white/[0.045] hover:border-white/25"
            }`}
        >
            {selected && (
                <span className={`absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    <Check size={16} strokeWidth={3} />
                </span>
            )}

            <div className={`grid h-[72px] w-[72px] place-items-center rounded-full border text-white transition ${selected ? `${palette.border} bg-black/35` : "border-white/20 bg-black/35 text-white group-hover:border-white/35 group-hover:bg-black/45"}`}>
                <Icon size={36} strokeWidth={modifier.id === "extraHeart" ? 0 : 2.2} fill={modifier.id === "extraHeart" ? "currentColor" : "none"} />
            </div>

            <h4 className="mt-5 text-xl font-black text-white">{modifier.name}</h4>
            <p className="mt-2 min-h-[2.5rem] max-w-[10rem] text-base leading-tight text-white/82">{modifier.shortDescription}</p>

            <span className="mt-4 min-w-[92px] rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm font-black text-lime-300">
                Score: x{modifier.scoreMultiplier.toFixed(2)}
            </span>
        </button>
    )
}
