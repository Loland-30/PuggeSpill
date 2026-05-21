import { Check, ChevronLeft, ImagePlus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import FadeIn from "../components/FadeIn"
import PageContentTransition from "../components/PageContentTransition"
import AppPageShell from "../components/layout/AppPageShell"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { backgroundThemes, getOverlayOpacity, overlayStrengths, paletteThemes } from "../theme/themes"

type PaletteView = "solid" | "gradient"

const maxPaletteOptionCount = Math.max(
    ...["solid", "gradient"].map(kind => paletteThemes.filter(option => option.kind === kind).length)
)

export default function ThemePage() {
    const navigate = useNavigate()
    const { t } = useI18n()
    const { theme, palette, setBackground, setPalette, setCustomBackgroundImage, setOverlayStrength } = useTheme()
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

    const getOverlayLabel = (id: string) => {
        if (id === "low") return t.themePage.low
        if (id === "medium") return t.themePage.medium
        return t.themePage.high
    }

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="max-w-[70rem] pb-8">
                <FadeIn>
                    <button
                        onClick={() => navigate("/decks")}
                        className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                        <ChevronLeft size={18} />
                        {t.themePage.backToDecks}
                    </button>
                </FadeIn>

                <FadeIn className="mb-10">
                    <p className={`text-sm font-black uppercase tracking-[0.35em] ${palette.accentText}`}>{t.themePage.kicker}</p>
                    <h1 className="mt-3 text-5xl font-black">{t.themePage.title}</h1>
                    <p className="mt-3 max-w-2xl text-white/70">
                        {t.themePage.intro}
                    </p>
                </FadeIn>

                <FadeIn>
                    <section>
                        <h2 className="text-2xl font-black">{t.themePage.backgroundImage}</h2>
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
                                            <span className={`absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full ${palette.primaryButton} ${palette.primaryButtonText}`}>
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
                        <h2 className="text-2xl font-black">{t.themePage.customImage}</h2>
                        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                            <div className={`rounded-lg border-2 ${theme.customBackgroundImage ? palette.border : "border-white/10"} p-4 ${theme.customBackgroundImage ? palette.glow : ""}`}>
                                <div
                                    className={`relative h-56 overflow-hidden rounded-lg bg-gradient-to-br ${backgroundThemes.find(background => background.id === theme.backgroundId)?.preview ?? "from-slate-950 to-slate-800"}`}
                                >
                                    {theme.customBackgroundImage && (
                                        <>
                                            <img
                                                src={theme.customBackgroundImage}
                                                alt={t.themePage.customBackgroundPreviewAlt}
                                                className="h-full w-full object-cover"
                                            />
                                            <div
                                                className="absolute inset-0 bg-black"
                                                style={{ opacity: getOverlayOpacity(theme.overlayStrength) }}
                                            />
                                        </>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-4">
                                        <p className="text-xl font-black">{t.themePage.preview}</p>
                                        <p className="text-sm text-white/70">{t.themePage.deckAndCreatePagesUseBackground}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-3">
                                    <label className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${palette.primaryButtonText} ${palette.primaryButton}`}>
                                        <ImagePlus size={18} strokeWidth={2.5} />
                                        {t.themePage.uploadImage}
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
                                            {t.themePage.remove}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                                <p className="text-sm font-black uppercase tracking-[0.25em] text-white/60">{t.themePage.overlay}</p>
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
                                                    <span className="block font-bold">{getOverlayLabel(option.id)}</span>
                                                    <span className="text-xs text-white/50">{t.themePage.blackOverlay.replace("{percent}", String(Math.round(option.opacity * 100)))}</span>
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
                        <h2 className="text-2xl font-black">{t.themePage.palette}</h2>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <PaletteViewButton
                                label={t.themePage.solidColors}
                                active={paletteView === "solid"}
                                onClick={() => setPaletteView("solid")}
                            />
                            <PaletteViewButton
                                label={t.themePage.gradients}
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
                        <h2 className="text-2xl font-black">{t.themePage.preview}</h2>
                        <div className={`mt-5 rounded-[28px] border-2 ${palette.border} ${palette.card} ${palette.glow} px-8 py-6`}>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-3xl font-black">{t.themePage.previewDeckName}</p>
                                    <p className="mt-1 text-sm text-white/70">{t.deckPage.wordCount}: 42</p>
                                </div>
                                <button className={`rounded-full px-5 py-2 text-sm font-black ${palette.primaryButtonText} ${palette.primaryButton}`}>
                                    {t.common.play}
                                </button>
                            </div>
                        </div>
                    </section>
                </FadeIn>
                <FadeIn>
                    <section className="mt-12 flex justify-end pb-8">
                        <button
                            type="button"
                            onClick={() => navigate("/decks")}
                            className={`rounded-full px-10 py-3 text-base font-black ${palette.primaryButtonText} shadow-xl transition hover:-translate-y-0.5 ${palette.primaryButton}`}
                        >
                            {t.themePage.saveTheme}
                        </button>
                    </section>
                </FadeIn>
            </AppPageShell>
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
                active ? `${palette.border} ${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}` : "border-white/10 bg-black/20 text-white/55 hover:border-white/40 hover:text-white"
            }`}
        >
            {label}
        </button>
    )
}
