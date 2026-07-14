import { Check, ImagePlus, Trash2 } from "lucide-react"
import { useState } from "react"

import { uploadThemeBackgroundImage } from "../api/theme"
import { useUISound } from "../audio/useUISound"
import FadeIn from "../components/FadeIn"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import AudioThemePanel from "../components/theme/AudioThemePanel"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { backgroundThemes, getOverlayOpacity, overlayStrengths, paletteThemes, type GlowStrength } from "../theme/themes"
import { resolveAssetUrl } from "../utils/assetUrl"

type ThemeMode = "visual" | "audio"
type BackgroundMode = "color" | "image"
type PaletteView = "solid" | "gradient"

const maxPaletteOptionCount = Math.max(
    ...["solid", "gradient"].map(kind => paletteThemes.filter(option => option.kind === kind).length)
)

export default function ThemePage() {
    const { t } = useI18n()
    const { theme, setCustomBackgroundImage } = useTheme()
    const [themeMode, setThemeMode] = useState<ThemeMode>("visual")
    const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(theme.customBackgroundImage ? "image" : "color")
    const [paletteView, setPaletteView] = useState<PaletteView>(() =>
        paletteThemes.find(option => option.id === theme.paletteId)?.kind ?? "solid"
    )
    const [backgroundUploadError, setBackgroundUploadError] = useState<string | null>(null)
    const [isUploadingBackground, setIsUploadingBackground] = useState(false)

    const handleImageUpload = async (file: File | undefined) => {
        if (!file) return

        setBackgroundUploadError(null)
        setIsUploadingBackground(true)

        try {
            const imageUrl = await uploadThemeBackgroundImage(file)
            setCustomBackgroundImage(imageUrl)
            setBackgroundMode("image")
        } catch (error) {
            setBackgroundUploadError(error instanceof Error ? error.message : "Kunne ikke laste opp bakgrunnsbilde")
        } finally {
            setIsUploadingBackground(false)
        }
    }

    const getOverlayLabel = (id: string) => {
        if (id === "low") return t.themePage.low
        if (id === "medium") return t.themePage.medium
        return t.themePage.high
    }

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="max-w-[70rem] pb-8">
                <FadeIn className="mb-8">
                    <h1 className="text-3xl font-black sm:text-5xl">Themes</h1>
                    <div className="mt-6">
                        <SegmentedControl
                            options={[
                                { value: "visual", label: "Visual" },
                                { value: "audio", label: "Audio" }
                            ]}
                            value={themeMode}
                            onChange={value => setThemeMode(value as ThemeMode)}
                        />
                    </div>
                </FadeIn>

                {themeMode === "visual" ? (
                    <VisualThemeSettings
                        backgroundMode={backgroundMode}
                        setBackgroundMode={setBackgroundMode}
                        paletteView={paletteView}
                        setPaletteView={setPaletteView}
                        handleImageUpload={handleImageUpload}
                        isUploadingBackground={isUploadingBackground}
                        backgroundUploadError={backgroundUploadError}
                        getOverlayLabel={getOverlayLabel}
                    />
                ) : (
                    <FadeIn>
                        <AudioThemePanel />
                    </FadeIn>
                )}
            </AppPageShell>
        </PageContentTransition>
    )
}

function VisualThemeSettings({
    backgroundMode,
    setBackgroundMode,
    paletteView,
    setPaletteView,
    handleImageUpload,
    isUploadingBackground,
    backgroundUploadError,
    getOverlayLabel
}: {
    backgroundMode: BackgroundMode
    setBackgroundMode: (mode: BackgroundMode) => void
    paletteView: PaletteView
    setPaletteView: (view: PaletteView) => void
    handleImageUpload: (file: File | undefined) => Promise<void>
    isUploadingBackground: boolean
    backgroundUploadError: string | null
    getOverlayLabel: (id: string) => string
}) {
    const { t } = useI18n()
    const { theme, palette, setBackground, setPalette, setCustomBackgroundImage, setOverlayStrength, setGlowStrength } = useTheme()
    const { playHoverSound } = useUISound()
    const customBackgroundSrc = resolveAssetUrl(theme.customBackgroundImage)

    return (
        <>
            <FadeIn>
                <section>
                    <SectionHeader title="Background" />
                    <div className="mt-4">
                        <SegmentedControl
                            options={[
                                { value: "color", label: "Background Color" },
                                { value: "image", label: "Background Image" }
                            ]}
                            value={backgroundMode}
                            onChange={value => setBackgroundMode(value as BackgroundMode)}
                        />
                    </div>

                    {backgroundMode === "color" ? (
                        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 md:gap-4">
                            {backgroundThemes.map(background => {
                                const selected = theme.backgroundId === background.id

                                return (
                                    <button
                                        key={background.id}
                                        onClick={() => setBackground(background.id)}
                                        onMouseEnter={playHoverSound}
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
                    ) : (
                        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
                            <div className={`rounded-lg border-2 ${customBackgroundSrc ? palette.border : "border-white/10"} p-4 ${customBackgroundSrc ? palette.glow : ""}`}>
                                <div
                                    className={`relative h-44 overflow-hidden rounded-lg bg-gradient-to-br sm:h-56 ${backgroundThemes.find(background => background.id === theme.backgroundId)?.preview ?? "from-slate-950 to-slate-800"}`}
                                >
                                    {customBackgroundSrc && (
                                        <>
                                            <img
                                                src={customBackgroundSrc}
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
                                    <label
                                        onMouseEnter={playHoverSound}
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${palette.primaryButtonText} ${palette.primaryButton} ${isUploadingBackground ? "opacity-70" : ""}`}
                                    >
                                        <ImagePlus size={18} strokeWidth={2.5} />
                                        {isUploadingBackground ? "Uploading..." : t.themePage.uploadImage}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            disabled={isUploadingBackground}
                                            onChange={event => {
                                                void handleImageUpload(event.target.files?.[0])
                                                event.currentTarget.value = ""
                                            }}
                                            className="hidden"
                                        />
                                    </label>

                                    {theme.customBackgroundImage && (
                                        <button
                                            onClick={() => setCustomBackgroundImage(null)}
                                            onMouseEnter={playHoverSound}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white/80 transition hover:border-red-300 hover:text-red-200"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                            {t.themePage.remove}
                                        </button>
                                    )}
                                </div>

                                {backgroundUploadError && (
                                    <p className="mt-3 text-sm font-semibold text-red-200">{backgroundUploadError}</p>
                                )}
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
                                                onMouseEnter={playHoverSound}
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
                    )}
                </section>
            </FadeIn>

            <FadeIn>
                <section className="mt-12">
                    <SectionHeader title={t.themePage.palette} />
                    <div className="mt-4 flex flex-wrap gap-3">
                        <SegmentButton label={t.themePage.solidColors} active={paletteView === "solid"} onClick={() => setPaletteView("solid")} />
                        <SegmentButton label={t.themePage.gradients} active={paletteView === "gradient"} onClick={() => setPaletteView("gradient")} />
                    </div>

                    <div className="mt-5 grid auto-rows-[8.5rem] gap-3 sm:auto-rows-[9.75rem] sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                        {paletteThemes.filter(option => option.kind === paletteView).map(option => {
                            const selected = theme.paletteId === option.id

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setPalette(option.id)}
                                    onMouseEnter={playHoverSound}
                                    className={`flex h-full flex-col rounded-lg border-2 p-4 text-left transition ${
                                        selected ? `${option.border} ${palette.glow}` : "border-white/10 hover:border-white/40"
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
                    <SectionHeader title={t.themePage.glow} />
                    <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/62">{t.themePage.glowDescription}</p>
                    <div className="mt-5 inline-flex flex-wrap rounded-full border border-white/10 bg-black/25 p-1">
                        {(["off", "low", "medium", "high"] as GlowStrength[]).map(strength => {
                            const selected = theme.glowStrength === strength
                            const label = strength === "off"
                                ? t.themePage.off
                                : strength === "low"
                                    ? t.themePage.low
                                    : strength === "medium"
                                        ? t.themePage.medium
                                        : t.themePage.high

                            return (
                                <button
                                    key={strength}
                                    type="button"
                                    onClick={() => setGlowStrength(strength)}
                                    onMouseEnter={playHoverSound}
                                    className={`rounded-full px-5 py-2 text-sm font-black transition ${
                                        selected ? `${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}` : "text-white/55 hover:text-white"
                                    }`}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </section>
            </FadeIn>

            <ThemePreview />
        </>
    )
}

function ThemePreview() {
    const { t } = useI18n()
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()

    return (
        <FadeIn>
            <section className="mt-12">
                <SectionHeader title={t.themePage.preview} />
                <div className={`mt-5 rounded-[28px] border-2 ${palette.border} ${palette.card} ${palette.glow} px-8 py-6`}>
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-3xl font-black">{t.themePage.previewDeckName}</p>
                            <p className="mt-1 text-sm text-white/70">{t.deckPage.wordCount}: 42</p>
                        </div>
                        <button
                            onMouseEnter={playHoverSound}
                            className={`rounded-full px-5 py-2 text-sm font-black ${palette.primaryButtonText} ${palette.primaryButton}`}
                        >
                            {t.common.play}
                        </button>
                    </div>
                </div>
            </section>
        </FadeIn>
    )
}

function SectionHeader({ title }: { title: string }) {
    return <h2 className="text-2xl font-black">{title}</h2>
}

function SegmentedControl({ options, value, onChange }: {
    options: Array<{ value: string; label: string }>
    value: string
    onChange: (value: string) => void
}) {
    return (
        <div className="inline-flex rounded-full border border-white/10 bg-black/25 p-1 backdrop-blur">
            {options.map(option => (
                <SegmentButton
                    key={option.value}
                    label={option.label}
                    active={value === option.value}
                    onClick={() => onChange(option.value)}
                />
            ))}
        </div>
    )
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()

    return (
        <button
            type="button"
            onClick={onClick}
            onMouseEnter={playHoverSound}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${
                active ? `${palette.primaryButton} ${palette.primaryButtonText} ${palette.glow}` : "text-white/55 hover:text-white"
            }`}
        >
            {label}
        </button>
    )
}
