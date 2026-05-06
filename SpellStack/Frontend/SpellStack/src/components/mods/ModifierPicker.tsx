import { useMemo, useState } from "react"
import { X } from "lucide-react"
import type { ActiveGameModifier } from "../../api/gameSession"
import type { ModifierCategory } from "./modifierData"
import { MODIFIER_DEFINITIONS } from "./modifierData"
import { toggleModifier } from "./modifierUtils"
import ModifierTabs from "./ModifierTabs"
import ModifierCard from "./ModifierCard"
import ActiveModifiersSummary from "./ActiveModifierSummary"

interface Props {
    selectedModifiers: ActiveGameModifier[]
    onChange: (modifiers: ActiveGameModifier[]) => void
    onClose: () => void
}

export default function ModifierPicker({ selectedModifiers, onChange, onClose }: Props) {
    const [activeCategory, setActiveCategory] = useState<ModifierCategory>("harder")

    const visibleModifiers = useMemo(() => {
        return MODIFIER_DEFINITIONS.filter(modifier => modifier.category === activeCategory)
    }, [activeCategory])

    function handleToggle(modifier: ActiveGameModifier) {
        onChange(toggleModifier(selectedModifiers, modifier))
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <ModifierTabs
                    activeCategory={activeCategory}
                    onChange={setActiveCategory}
                />

                <button
                    type="button"
                    onClick={onClose}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-gray-800 shadow-xl transition hover:bg-orange-400 hover:text-white"
                    aria-label="Close modifier picker"
                >
                    <X size={20} strokeWidth={2.7} />
                </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleModifiers.map(modifier => (
                    <ModifierCard
                        key={String(modifier.id)}
                        modifier={modifier}
                        selected={selectedModifiers.includes(modifier.id)}
                        onToggle={handleToggle}
                    />
                ))}
            </div>

            <div className="mt-5">
                <ActiveModifiersSummary modifiers={selectedModifiers} />
            </div>
        </div>
    )
}