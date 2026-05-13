import { Check, ChevronLeft, ImagePlus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import FadeIn from "../components/FadeIn"
import { useTheme } from "../theme/ThemeContext"
import { backgroundThemes, getOverlayOpacity, overlayStrengths, paletteThemes, textTones } from "../theme/themes"
import PageContentTransition from "../components/PageContentTransition"

type PaletteView = "solid" | "gradient"

const maxPaletteOptionCount = Math.max(
    ...["solid", "gradient"].map(kind => paletteThemes.filter(option => option.kind === kind).length)
)

export default function ThemePage() {
    const navigate = useNavigate()
    const { theme, palette, setBackground, setPalette, setCustomBackgroundImage, setOverlayStrength, setTextTone } = useTheme()
    const [paletteView, setPaletteView] = useState<PaletteView>(() =>
        paletteThemes.find(option => option.id === theme.paletteId)?.kind ?? "solid"
    )

    const handleImageUpload = (file: File | undefined) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === "string") setCustomBackgroundImage(reader.result)
        }
        reader.readAsDataURL(file)
    }

    return (
        <PageContentTransition>
            <div className="relative z-10 mx-auto w-full max-w-[70rem]">
                <FadeIn>
                <button
                    onClick={() => navigate("/decks")}
                    className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
                >
                    <ChevronLeft size={18} />
                    Back to decks
                </button>
                </FadeIn>

                <FadeIn className="mb-10">
                    <p className={`text-sm font-black uppercase tracking-[0.35em] ${palette.accentText}`}>Customize</p>
                    <h1 className="mt-3 text-5xl font-black">Theme</h1>
                    <p className="mt-3 max-w-2xl text-white/70">
                        Pick a background and color palette for your deck menu and deck creation flow.
                    </p>
                </FadeIn>

                <FadeIn>
                <section>
                    <h2 className="text-2xl font-black">Background image</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-5">
                        {backgroundThemes.map(background => {
                            const selected = theme.backgroundId === background.id

                            return (
                                <button
                                    key={background.id}
                                    onClick={() => setBackground(background.id)}
                                    className={`relative overflow-hidden rounded-lg border-2 p-3 text-left transition ${
                                        selected ? `${palette.border} ${palette.glow}` : "border-white/10 hover:border-white/40"
                                    }`}
                                >
                                    <div className={`h-28 rounded-md bg-gradient-to-br ${background.preview}`} />
                                    <p className="mt-3 text-sm font-bold">{background.name}</p>
                                    {selected && (
                                        <span className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full ${palette.primaryButton} text-white`}>
                                            <Check size={18} strokeWidth={3} />
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </section>
                </FadeIn>

                <FadeIn>
                <section className="mt-12">
                    <h2 className="text-2xl font-black">Custom image</h2>
                    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                        <div className={`rounded-lg border-2 ${theme.customBackgroundImage ? palette.border : "border-white/10"} p-4 ${theme.customBackgroundImage ? palette.glow : ""}`}>
                            <div
                                className={`relative h-56 overflow-hidden rounded-lg bg-gradient-to-br ${backgroundThemes.find(background => background.id === theme.backgroundId)?.preview ?? "from-slate-950 to-slate-800"}`}
                            >
                                {theme.customBackgroundImage && (
                                    <>
                                        <img
                                            src={theme.customBackgroundImage}
                                            alt="Custom background preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <div
                                            className="absolute inset-0 bg-black"
                                            style={{ opacity: getOverlayOpacity(theme.overlayStrength) }}
                                        />
                                    </>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-4">
                                    <p className="text-xl font-black">Preview</p>
                                    <p className="text-sm text-white/70">Deck and create pages will use this background.</p>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white ${palette.primaryButton}`}>
                                    <ImagePlus size={18} strokeWidth={2.5} />
                                    Upload image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={event => handleImageUpload(event.target.files?.[0])}
                                        className="hidden"
                                    />
                                </label>

                                {theme.customBackgroundImage && (
                                    <button
                                        onClick={() => setCustomBackgroundImage(null)}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-red-300 hover:text-red-200"
                                    >
                                        <Trash2 size={18} strokeWidth={2.5} />
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/60">Overlay</p>
                            <div className="mt-4 grid gap-3">
                                {overlayStrengths.map(option => {
                                    const selected = theme.overlayStrength === option.id

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setOverlayStrength(option.id)}
                                            className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition ${
                                                selected ? `${palette.border} bg-white/15` : "border-white/10 hover:border-white/40"
                                            }`}
                                        >
                                            <span>
                                                <span className="block font-bold">{option.name}</span>
                                                <span className="text-xs text-white/50">{Math.round(option.opacity * 100)}% black overlay</span>
                                            </span>
                                            {selected && <Check size={18} strokeWidth={3} />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </section>
                </FadeIn>

                <FadeIn>
                <section className="mt-12">
                    <h2 className="text-2xl font-black">Palette</h2>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <PaletteViewButton
                            label="Solid colors"
                            active={paletteView === "solid"}
                            onClick={() => setPaletteView("solid")}
                        />
                        <PaletteViewButton
                            label="Gradients"
                            active={paletteView === "gradient"}
                            onClick={() => setPaletteView("gradient")}
                        />
                    </div>

                    <div className="mt-5 grid auto-rows-[9.75rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {paletteThemes.filter(option => option.kind === paletteView).map(option => {
                            const selected = theme.paletteId === option.id

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setPalette(option.id)}
                                    className={`flex h-full flex-col rounded-lg border-2 p-4 text-left transition ${
                                        selected ? `${option.border} ${option.glow}` : "border-white/10 hover:border-white/40"
                                    }`}
                                >
                                    <div className={`h-14 rounded-md ${option.preview}`} />
                                    <div className="mt-4 flex min-h-6 items-center justify-between gap-3">
                                        <p className="truncate font-bold">{option.name}</p>
                                        <span className="grid h-5 w-5 shrink-0 place-items-center">
                                            {selected && <Check size={18} strokeWidth={3} />}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                        {Array.from({
                            length: maxPaletteOptionCount - paletteThemes.filter(option => option.kind === paletteView).length
                        }).map((_, index) => (
                            <div
                                key={`palette-placeholder-${index}`}
                                aria-hidden="true"
                                className="invisible h-full rounded-lg border-2 p-4"
                            />
                        ))}
                    </div>
                </section>
                </FadeIn>

                <FadeIn>
                <section className="mt-12">
                    <h2 className="text-2xl font-black">Form text</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {textTones.map(option => {
                            const selected = theme.textTone === option.id

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setTextTone(option.id)}
                                    className={`rounded-lg border-2 p-4 text-left transition ${
                                        selected ? `${palette.border} ${palette.glow}` : "border-white/10 hover:border-white/40"
                                    }`}
                                >
                                    <div className={`rounded-lg border border-white/20 px-4 py-3 ${option.panelClass} ${option.inputClass}`}>
                                        Example text
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <p className="font-bold">{option.name}</p>
                                        {selected && <Check size={18} strokeWidth={3} />}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </section>
                </FadeIn>

                <FadeIn>
                <section className="mt-12">
                    <h2 className="text-2xl font-black">Preview</h2>
                    <div className={`mt-5 rounded-[28px] border-2 ${palette.border} ${palette.card} ${palette.glow} px-8 py-6`}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-3xl font-black">Irregular verbs</p>
                                <p className="mt-1 text-sm text-white/70">Word count: 42</p>
                            </div>
                            <button className={`rounded-full px-5 py-2 text-sm font-black text-white ${palette.primaryButton}`}>
                                Play
                            </button>
                        </div>
                    </div>
                </section>
                </FadeIn>
            </div>
        </PageContentTransition>
    )
}

function PaletteViewButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    const { palette } = useTheme()

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-5 py-2 text-sm font-black uppercase tracking-[0.18em] transition ${
                active ? `${palette.border} ${palette.primaryButton} text-white ${palette.glow}` : "border-white/10 bg-black/20 text-white/55 hover:border-white/40 hover:text-white"
            }`}
        >
            {label}
        </button>
    )
}
