import { Check, ChevronLeft, ImagePlus, Music2, Play, Trash2, Volume2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"

import { hoverAudioPresets } from "../audio/audioPresets"
import { useAudioPreview } from "../audio/useAudioPreview"
import { useUISound } from "../audio/useUISound"
import FadeIn from "../components/FadeIn"
import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { backgroundThemes, getOverlayOpacity, overlayStrengths, paletteThemes, type AudioPresetKey } from "../theme/themes"

type ThemeMode = "visual" | "audio"
type BackgroundMode = "color" | "image"
type PaletteView = "solid" | "gradient"

const maxPaletteOptionCount = Math.max(
    ...["solid", "gradient"].map(kind => paletteThemes.filter(option => option.kind === kind).length)
)

export default function ThemePage() {
    const navigate = useNavigate()
    const { t } = useI18n()
    const {
        theme,
        palette,
        setCustomBackgroundImage,
        setAudioPreset
    } = useTheme()
    const { playPreset } = useAudioPreview()
    const { playHoverSound } = useUISound()
    const [themeMode, setThemeMode] = useState<ThemeMode>("visual")
    const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(theme.customBackgroundImage ? "image" : "color")
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
                        onMouseEnter={playHoverSound}
                        className="mb-10 flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
                    >
                        <ChevronLeft size={18} />
                        {t.themePage.backToDecks}
                    </button>
                </FadeIn>

                <FadeIn className="mb-8">
                    <h1 className="text-5xl font-black">Themes</h1>
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
                        getOverlayLabel={getOverlayLabel}
                    />
                ) : (
                    <AudioThemeSettings
                        onPreview={playPreset}
                        onHoverSoundChange={value => setAudioPreset("hoverSound", value)}
                    />
                )}

                <FadeIn>
                    <section className="mt-12 flex justify-end pb-8">
                        <button
                            type="button"
                            onClick={() => navigate("/decks")}
                            onMouseEnter={playHoverSound}
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

function VisualThemeSettings({ backgroundMode, setBackgroundMode, paletteView, setPaletteView, handleImageUpload, getOverlayLabel }: {
    backgroundMode: BackgroundMode
    setBackgroundMode: (mode: BackgroundMode) => void
    paletteView: PaletteView
    setPaletteView: (view: PaletteView) => void
    handleImageUpload: (file: File | undefined) => void
    getOverlayLabel: (id: string) => string
}) {
    const { t } = useI18n()
    const { theme, palette, setBackground, setPalette, setCustomBackgroundImage, setOverlayStrength } = useTheme()
    const { playHoverSound } = useUISound()

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
                        <div className="mt-5 grid gap-4 md:grid-cols-5">
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
                                    <label
                                        onMouseEnter={playHoverSound}
                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${palette.primaryButtonText} ${palette.primaryButton}`}
                                    >
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
                                            onMouseEnter={playHoverSound}
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

                    <div className="mt-5 grid auto-rows-[9.75rem] gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {paletteThemes.filter(option => option.kind === paletteView).map(option => {
                            const selected = theme.paletteId === option.id

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => setPalette(option.id)}
                                    onMouseEnter={playHoverSound}
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

            <ThemePreview />
        </>
    )
}

function AudioThemeSettings({ onPreview, onHoverSoundChange }: {
    onPreview: (presetKey: string | null | undefined) => void
    onHoverSoundChange: (value: AudioPresetKey | null) => void
}) {
    const { theme, palette, setAudioEnabled, setUiVolume, setMusicVolume } = useTheme()
    const { playHoverSound } = useUISound()

    return (
        <div className="space-y-8">
            <FadeIn>
                <AudioPanel title="Master" icon={<Volume2 size={22} strokeWidth={2.5} />}>
                    <ToggleRow
                        title="Enable audio"
                        description="Controls audio previews and future UI/music playback."
                        checked={theme.audio.audioEnabled}
                        onChange={setAudioEnabled}
                    />
                    <VolumeRow title="UI volume" value={theme.audio.uiVolume} onChange={setUiVolume} />
                    <VolumeRow title="Music volume" value={theme.audio.musicVolume} onChange={setMusicVolume} />
                </AudioPanel>
            </FadeIn>

            <FadeIn>
                <AudioPanel title="Interface sounds" icon={<Play size={22} strokeWidth={2.5} />}>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.22em] text-white/50">Hover effect</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {hoverAudioPresets.map(preset => {
                                const selected = theme.audio.hoverSound === preset.key

                                return (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        onClick={() => onHoverSoundChange(preset.key)}
                                        onMouseEnter={playHoverSound}
                                        className={`rounded-2xl border p-4 text-left transition ${
                                            selected ? `${palette.border} ${palette.card} ${palette.glow}` : "border-white/10 bg-white/[0.04] hover:border-white/35"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-lg font-black text-white">{preset.displayName}</p>
                                                <p className="mt-1 text-sm font-semibold text-white/50">Soft UI hover feedback.</p>
                                            </div>
                                            {selected && <Check size={20} strokeWidth={3} />}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={event => {
                                                event.stopPropagation()
                                                onPreview(preset.key)
                                            }}
                                            disabled={!theme.audio.audioEnabled || theme.audio.uiVolume <= 0}
                                            onMouseEnter={playHoverSound}
                                            className={`mt-5 rounded-full px-4 py-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${palette.primaryButton} ${palette.primaryButtonText}`}
                                        >
                                            Preview
                                        </button>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <ComingSoonGrid items={["Click sound", "Success sound", "Error sound", "Sign-in sound"]} />
                </AudioPanel>
            </FadeIn>

            <FadeIn>
                <AudioPanel title="Music" icon={<Music2 size={22} strokeWidth={2.5} />}>
                    <ComingSoonGrid items={["Background music", "In-game music", "Upload custom sound"]} />
                </AudioPanel>
            </FadeIn>
        </div>
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

function AudioPanel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
    const { palette } = useTheme()

    return (
        <section className={`rounded-[2rem] border ${palette.border} ${palette.card} p-6 shadow-2xl backdrop-blur-xl`}>
            <div className="mb-6 flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-2xl ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    {icon}
                </span>
                <h2 className="text-2xl font-black text-white">{title}</h2>
            </div>
            <div className="space-y-5">
                {children}
            </div>
        </section>
    )
}

function ToggleRow({ title, description, checked, onChange }: {
    title: string
    description: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    const { palette } = useTheme()
    const { playHoverSound } = useUISound()

    return (
        <div className="flex items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black/15 p-4">
            <div>
                <p className="font-black text-white">{title}</p>
                <p className="mt-1 text-sm font-semibold text-white/48">{description}</p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                onMouseEnter={playHoverSound}
                className={`relative h-8 w-14 rounded-full transition ${checked ? palette.primaryButton : "bg-white/15"}`}
                aria-pressed={checked}
            >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${checked ? "left-7" : "left-1"}`} />
            </button>
        </div>
    )
}

function VolumeRow({ title, value, onChange }: {
    title: string
    value: number
    onChange: (value: number) => void
}) {
    const { palette } = useTheme()
    const percent = Math.round(value * 100)

    return (
        <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <p className="font-black text-white">{title}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-black ${palette.primaryButton} ${palette.primaryButtonText}`}>
                    {percent}%
                </span>
            </div>
            <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={event => onChange(Number(event.target.value) / 100)}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-current"
            />
        </div>
    )
}

function ComingSoonGrid({ items }: { items: string[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {items.map(item => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 opacity-65">
                    <p className="font-black text-white">{item}</p>
                    <p className="mt-1 text-sm font-semibold text-white/42">Coming soon</p>
                </div>
            ))}
        </div>
    )
}
