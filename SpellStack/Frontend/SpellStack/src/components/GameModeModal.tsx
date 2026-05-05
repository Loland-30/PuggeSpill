import { useState } from "react"
import type { Deck } from "../api/decks"
import type { ActiveGameModifier, GameDirection } from "../api/gameSession"
import { languages } from "../data/languages"
import ModifierPicker, { getModifierNames } from "./ModifierPicker"

interface Props {
    isOpen: boolean
    deck: Deck
    onSelect: (direction: GameDirection, modifiers: ActiveGameModifier[]) => void
}

export default function GameModeModal({ isOpen, deck, onSelect }: Props) {
    const [modifiers, setModifiers] = useState<ActiveGameModifier[]>([])
    const [showModifierPicker, setShowModifierPicker] = useState(false)

    if (!isOpen || !deck) return null

    const lang1 = languages.find(l => l.code === deck.language)
    const lang2 = languages.find(l => l.code === deck.translationLanguage)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">
            <div className="relative flex w-full max-w-5xl flex-col items-center gap-6">
                <div className="flex w-full max-w-4xl items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold text-white">Choose game mode</h2>

                    <button
                        onClick={() => setShowModifierPicker(open => !open)}
                        className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold shadow-xl transition ${
                            modifiers.length === 0
                                ? "bg-white text-gray-700 hover:bg-orange-50"
                                : "bg-orange-400 text-white hover:bg-orange-500"
                        }`}
                    >
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-black/10 text-xs">+</span>
                        Mods: {getModifierNames(modifiers)}
                    </button>
                </div>

                {showModifierPicker ? (
                    <ModifierPicker
                        selectedModifiers={modifiers}
                        onChange={setModifiers}
                        onClose={() => setShowModifierPicker(false)}
                    />
                ) : (
                    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
                        <button
                            onClick={() => onSelect("original", modifiers)}
                            className="flex min-h-[230px] flex-col justify-between rounded-2xl bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:bg-orange-400 hover:text-white"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-1 flex-col items-center gap-3">
                                    <img
                                        src={lang1?.flagUrl}
                                        alt={lang1?.label}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <p className="text-center text-xl font-bold">{lang1?.label}</p>
                                </div>

                                <div className="pt-3 text-lg font-semibold">to</div>

                                <div className="flex flex-1 flex-col items-center gap-3">
                                    <img
                                        src={lang2?.flagUrl}
                                        alt={lang2?.label}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <p className="text-center text-xl font-bold">{lang2?.label}</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400">
                                Translate from {lang1?.label}
                            </p>
                        </button>

                        <button
                            onClick={() => onSelect("translation", modifiers)}
                            className="flex min-h-[230px] flex-col justify-between rounded-2xl bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:bg-orange-400 hover:text-white"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex flex-1 flex-col items-center gap-3">
                                    <img
                                        src={lang2?.flagUrl}
                                        alt={lang2?.label}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <p className="text-center text-xl font-bold">{lang2?.label}</p>
                                </div>

                                <div className="pt-3 text-lg font-semibold">to</div>

                                <div className="flex flex-1 flex-col items-center gap-3">
                                    <img
                                        src={lang1?.flagUrl}
                                        alt={lang1?.label}
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    <p className="text-center text-xl font-bold">{lang1?.label}</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400">
                                Translate from {lang2?.label}
                            </p>
                        </button>

                        <button
                            onClick={() => onSelect("mixed", modifiers)}
                            className="flex min-h-[230px] flex-col justify-between rounded-2xl bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:bg-orange-400 hover:text-white"
                        >
                            <div className="flex flex-col gap-3">
                                <p className="text-2xl font-bold">Mixed</p>
                                <p className="text-3xl font-black">A/B</p>
                            </div>

                            <p className="text-sm text-gray-400">
                                Random direction each word
                            </p>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
