import { useMemo, useState } from "react"
import type { ActiveGameModifier } from "../api/gameSession"

interface Props {
    selectedModifiers: ActiveGameModifier[]
    onChange: (modifiers: ActiveGameModifier[]) => void
    onClose: () => void
}

interface ModifierOption {
    id: ActiveGameModifier
    name: string
    icon: string
    description: string
    multiplier: number
    group: "easier" | "harder"
}

const modifierOptions: ModifierOption[] = [
    {
        id: "zen",
        name: "Zen",
        icon: "Z",
        description: "No life loss, more time, score disabled",
        multiplier: 0,
        group: "easier"
    },
    {
        id: "extraHeart",
        name: "Extra heart",
        icon: "+",
        description: "Adds one heart",
        multiplier: 0.75,
        group: "easier"
    },
    {
        id: "hardcore",
        name: "Hardcore",
        icon: "1",
        description: "One heart, less time",
        multiplier: 1.5,
        group: "harder"
    },
    {
        id: "momentum",
        name: "Momentum",
        icon: ">",
        description: "Build stacks that drain time faster",
        multiplier: 1.25,
        group: "harder"
    },
    {
        id: "noTime",
        name: "No Time",
        icon: "?",
        description: "Timer is hidden but still runs",
        multiplier: 1.35,
        group: "harder"
    }
]

const maxModifierOptionCount = Math.max(
    ...["easier", "harder"].map(group => modifierOptions.filter(option => option.group === group).length)
)

export function getModifierNames(modifiers: ActiveGameModifier[]) {
    if (modifiers.length === 0) return "None"
    return modifiers
        .map(modifier => modifierOptions.find(option => option.id === modifier)?.name)
        .filter(Boolean)
        .join(", ")
}

export function getScoreMultiplier(modifiers: ActiveGameModifier[]) {
    if (modifiers.includes("zen")) return 0

    return modifiers.reduce((multiplier, modifier) => {
        const option = modifierOptions.find(item => item.id === modifier)
        return multiplier * (option?.multiplier ?? 1)
    }, 1)
}

export default function ModifierPicker({ selectedModifiers, onChange, onClose }: Props) {
    const [activeGroup, setActiveGroup] = useState<"easier" | "harder">(
        selectedModifiers.includes("hardcore") ? "harder" : "easier"
    )
    const visibleOptions = modifierOptions.filter(option => option.group === activeGroup)
    const scoreMultiplier = useMemo(() => getScoreMultiplier(selectedModifiers), [selectedModifiers])

    const toggleModifier = (modifier: ActiveGameModifier) => {
        const option = modifierOptions.find(item => item.id === modifier)
        if (!option) return

        if (selectedModifiers.includes(modifier)) {
            onChange(selectedModifiers.filter(selected => selected !== modifier))
            return
        }

        const compatibleModifiers = selectedModifiers.filter(selected => {
            if (modifier === "zen" && (selected === "momentum" || selected === "noTime")) return false
            if ((modifier === "momentum" || modifier === "noTime") && selected === "zen") return false

            const selectedOption = modifierOptions.find(item => item.id === selected)
            return selectedOption?.group === option.group
        })

        onChange([...compatibleModifiers, modifier])
    }

    return (
        <div className="w-full max-w-3xl">
            <div className="mb-0 flex items-end justify-between">
                <div className="grid grid-cols-2 overflow-hidden rounded-t-lg bg-white/20 p-1 text-xs font-bold uppercase tracking-widest text-white shadow-xl">
                    <button
                        onClick={() => setActiveGroup("easier")}
                        className={`flex items-center justify-center gap-2 rounded-md px-6 py-2 transition ${
                            activeGroup === "easier" ? "bg-orange-400 text-white" : "text-white/70 hover:text-white"
                        }`}
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-sm">+</span>
                        Easier
                    </button>
                    <button
                        onClick={() => setActiveGroup("harder")}
                        className={`flex items-center justify-center gap-2 rounded-md px-6 py-2 transition ${
                            activeGroup === "harder" ? "bg-orange-400 text-white" : "text-white/70 hover:text-white"
                        }`}
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-full border border-current text-sm">!</span>
                        Harder
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="mb-1 grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-black text-gray-500 shadow-xl transition hover:bg-orange-400 hover:text-white"
                    aria-label="Close mods"
                >
                    x
                </button>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-2xl">
                <div className="grid auto-rows-[11.5rem] grid-cols-2 gap-4 sm:grid-cols-3">
                    {visibleOptions.map(option => {
                        const enabled = selectedModifiers.includes(option.id)

                        return (
                            <button
                                key={option.id}
                                onClick={() => toggleModifier(option.id)}
                                className={`flex h-full flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 text-center transition ${
                                    enabled
                                        ? "border-orange-400 bg-orange-400 text-white shadow-lg"
                                        : "border-orange-300 bg-white text-orange-400 hover:bg-orange-50"
                                }`}
                            >
                                <span className={`grid h-14 w-14 place-items-center rounded-full border-2 border-current text-2xl font-black ${
                                    enabled ? "bg-white/20" : "bg-white"
                                }`}>
                                    {option.icon}
                                </span>
                                <span className="text-sm font-black uppercase tracking-widest">{option.name}</span>
                                <span className={`text-xs ${enabled ? "text-white/80" : "text-gray-400"}`}>
                                    {option.description}
                                </span>
                            </button>
                        )
                    })}
                    {Array.from({ length: maxModifierOptionCount - visibleOptions.length }).map((_, index) => (
                        <div
                            key={`modifier-placeholder-${index}`}
                            aria-hidden="true"
                            className="invisible h-full rounded-lg border-2 p-4"
                        />
                    ))}
                </div>

                <div className="mt-5 grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-[1fr_auto]">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Active mods</p>
                        <p className="mt-1 min-h-5 text-sm font-semibold text-gray-700">{getModifierNames(selectedModifiers)}</p>
                    </div>

                    <div className="rounded-lg bg-white px-5 py-3 text-right shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Score</p>
                        <p className={`text-2xl font-black ${scoreMultiplier === 0 ? "text-gray-400" : "text-orange-400"}`}>
                            x{scoreMultiplier.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
