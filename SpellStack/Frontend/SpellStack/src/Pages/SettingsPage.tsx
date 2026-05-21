import { useRef, useState } from "react"
import { KeyRound, Save } from "lucide-react"

import { useAuth } from "../auth/AuthContext"
import { appLanguages, countries } from "../data/languages"
import { useI18n } from "../i18n/I18nContext"
import { useTheme } from "../theme/ThemeContext"
import { getStoredLargerText, setGlobalLargerText } from "../utils/accessibilitySettings"
import FadeIn from "../components/FadeIn"
import PageContentTransition from "../components/PageContentTransition"
import AppPageShell from "../components/layout/AppPageShell"
import ChangePasswordModal, { type PasswordChangeRequest } from "../components/settings/ChangePasswordModal"
import SettingRow from "../components/settings/SettingRow"
import SettingsSection from "../components/settings/SettingsSection"
import SettingsSelect, { type SettingsSelectOption } from "../components/settings/SettingsSelect"
import SettingsSlider from "../components/settings/SettingsSlider"
import SettingsTabs, { type SettingsTab } from "../components/settings/SettingsTabs"
import SettingsToggle from "../components/settings/SettingsToggle"

const gameplaySettingsStorageKey = "spellstack_gameplay_settings"

type SectionId = "account" | "gameplay" | "audio" | "comfort" | "privacy"

type DefaultRoundLength = "10" | "25" | "50" | "endless"
type DefaultGameDirection = "known-to-learning" | "learning-to-known" | "mixed"
type WrongAnswerRevealDuration = "short" | "normal" | "long"
type AccentHandling = "strict" | "forgiving"

interface SettingsState {
    username: string
    email: string
    defaultRoundLength: DefaultRoundLength
    defaultGameDirection: DefaultGameDirection
    wrongAnswerRevealDuration: WrongAnswerRevealDuration
    autoFocusAnswerInput: boolean
    rushHourAutoSubmit: boolean
    accentHandling: AccentHandling
    masterVolume: number
    bgmVolume: number
    sfxVolume: number
    muteAll: boolean
    interfaceSounds: boolean
    loginProfileLoadSound: boolean
    reduceAnimations: boolean
    reduceScreenFlashes: boolean
    reduceGlowEffects: boolean
    largerText: boolean
    disableRushHourEffects: boolean
    showOtherCustomThemes: boolean
    hideOtherCustomBackgrounds: boolean
    hideOtherCustomAudio: boolean
    allowLobbyFriendRequests: boolean
}

interface StoredGameplaySettings {
    defaultRoundLength?: DefaultRoundLength
    defaultGameDirection?: DefaultGameDirection
    wrongAnswerRevealDuration?: WrongAnswerRevealDuration
    autoFocusAnswerInput?: boolean
    rushHourAutoSubmit?: boolean
    accentHandling?: AccentHandling
}

const appLanguageOptions: SettingsSelectOption[] = appLanguages.map(language => ({
    value: language.code,
    label: language.label,
    flagUrl: language.flagUrl
}))

const countryOptions: SettingsSelectOption[] = countries.map(country => ({
    value: country.code,
    label: country.label,
    flagUrl: country.flagUrl
}))

function readStoredGameplaySettings(): StoredGameplaySettings {
    try {
        return JSON.parse(localStorage.getItem(gameplaySettingsStorageKey) ?? "{}") as StoredGameplaySettings
    } catch {
        return {}
    }
}

export default function SettingsPage() {
    const { user } = useAuth()
    const { palette } = useTheme()
    const {
        t,
        appLanguage,
        manualAppLanguage,
        countryRegion,
        useRegionLanguage,
        setManualAppLanguage,
        setCountryRegion,
        setUseRegionLanguage
    } = useI18n()
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        account: null,
        gameplay: null,
        audio: null,
        comfort: null,
        privacy: null
    })
    const [activeTab, setActiveTab] = useState<SectionId>("account")
    const [savedMessage, setSavedMessage] = useState("")
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
    const [settings, setSettings] = useState<SettingsState>(() => {
        const storedGameplay = readStoredGameplaySettings()

        return {
            username: user?.username ?? "",
            email: user?.email ?? "",
            defaultRoundLength: storedGameplay.defaultRoundLength ?? "25",
            defaultGameDirection: storedGameplay.defaultGameDirection ?? "known-to-learning",
            wrongAnswerRevealDuration: storedGameplay.wrongAnswerRevealDuration ?? "normal",
            autoFocusAnswerInput: storedGameplay.autoFocusAnswerInput ?? true,
            rushHourAutoSubmit: storedGameplay.rushHourAutoSubmit ?? true,
            accentHandling: storedGameplay.accentHandling ?? "forgiving",
            masterVolume: 80,
            bgmVolume: 70,
            sfxVolume: 85,
            muteAll: false,
            interfaceSounds: true,
            loginProfileLoadSound: true,
            reduceAnimations: false,
            reduceScreenFlashes: true,
            reduceGlowEffects: false,
            largerText: getStoredLargerText(),
            disableRushHourEffects: false,
            showOtherCustomThemes: true,
            hideOtherCustomBackgrounds: false,
            hideOtherCustomAudio: false,
            allowLobbyFriendRequests: false
        }
    })

    const copy = t.settings
    const selectedAppLanguage = appLanguages.find(language => language.code === appLanguage) ?? appLanguages[0]
    const tabs: SettingsTab[] = [
        { id: "account", label: copy.tabs.account },
        { id: "gameplay", label: copy.tabs.gameplay },
        { id: "audio", label: copy.tabs.audio },
        { id: "comfort", label: copy.tabs.comfort },
        { id: "privacy", label: copy.tabs.privacy }
    ]

    const roundLengthOptions: SettingsSelectOption[] = [
        { value: "10", label: "10" },
        { value: "25", label: "25" },
        { value: "50", label: "50" },
        { value: "endless", label: copy.gameplay.endless }
    ]

    const gameDirectionOptions: SettingsSelectOption[] = [
        { value: "known-to-learning", label: copy.gameplay.knownToLearning },
        { value: "learning-to-known", label: copy.gameplay.learningToKnown },
        { value: "mixed", label: copy.gameplay.mixed }
    ]

    const revealDurationOptions: SettingsSelectOption[] = [
        { value: "short", label: copy.gameplay.short },
        { value: "normal", label: copy.gameplay.normal },
        { value: "long", label: copy.gameplay.long }
    ]

    const accentHandlingOptions: SettingsSelectOption[] = [
        { value: "strict", label: copy.gameplay.strict },
        { value: "forgiving", label: copy.gameplay.forgiving }
    ]

    const updateSetting = <Key extends keyof SettingsState>(key: Key, value: SettingsState[Key]) => {
        setSavedMessage("")
        setSettings(current => ({ ...current, [key]: value }))
    }

    const updateManualAppLanguage = (value: string) => {
        setSavedMessage("")
        setManualAppLanguage(value)
    }

    const updateCountryRegion = (value: string) => {
        setSavedMessage("")
        setCountryRegion(value)
    }

    const updateUseRegionLanguage = (value: boolean) => {
        setSavedMessage("")
        setUseRegionLanguage(value)
    }

    const updateLargerText = (value: boolean) => {
        setGlobalLargerText(value)
        updateSetting("largerText", value)
    }

    const scrollToSection = (sectionId: string) => {
        const id = sectionId as SectionId
        setActiveTab(id)
        sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const handlePasswordSave = (_request: PasswordChangeRequest) => {
        // TODO: Send password change request to a dedicated auth endpoint.
        setSavedMessage(copy.passwordReadyMessage)
    }

    const handleSave = () => {
        // TODO: Persist account/audio/comfort/privacy settings when user settings endpoints exist in the backend.
        localStorage.setItem(gameplaySettingsStorageKey, JSON.stringify({
            defaultRoundLength: settings.defaultRoundLength,
            defaultGameDirection: settings.defaultGameDirection,
            wrongAnswerRevealDuration: settings.wrongAnswerRevealDuration,
            autoFocusAnswerInput: settings.autoFocusAnswerInput,
            rushHourAutoSubmit: settings.rushHourAutoSubmit,
            accentHandling: settings.accentHandling
        }))
        setSavedMessage(copy.savedMessage)
    }

    const inputClassName = `w-full min-w-64 rounded-2xl border ${palette.border} bg-slate-950/90 px-4 py-3 text-sm font-bold text-white placeholder:text-white/35 outline-none backdrop-blur transition focus:ring-2 focus:ring-white/20`

    return (
        <>
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onSave={handlePasswordSave}
                palette={palette}
            />
            <PageContentTransition>
                <AppPageShell contentClassName="max-w-5xl pb-20">
                    <FadeIn className="mb-8">
                        <p className={`text-sm font-black uppercase tracking-[0.35em] ${palette.accentText}`}>{copy.pageKicker}</p>
                        <h1 className="mt-3 text-5xl font-black text-white">{copy.title}</h1>
                        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/62">
                            {copy.intro}
                        </p>
                    </FadeIn>

                    <SettingsTabs
                        tabs={tabs}
                        activeTab={activeTab}
                        onSelect={scrollToSection}
                        palette={palette}
                    />

                    <div className="space-y-8">
                        <div ref={element => { sectionRefs.current.account = element }}>
                            <SettingsSection
                                id="account"
                                title={copy.account.title}
                                description={copy.account.description}
                                palette={palette}
                            >
                                <SettingRow label={copy.account.username} description={copy.account.usernameDescription}>
                                    <input
                                        value={settings.username}
                                        onChange={event => updateSetting("username", event.target.value)}
                                        className={inputClassName}
                                        placeholder={copy.account.usernamePlaceholder}
                                        autoComplete="username"
                                    />
                                </SettingRow>

                                <SettingRow label={copy.account.email} description={copy.account.emailDescription}>
                                    <input
                                        type="email"
                                        value={settings.email}
                                        onChange={event => updateSetting("email", event.target.value)}
                                        className={inputClassName}
                                        placeholder={copy.account.emailPlaceholder}
                                        autoComplete="email"
                                    />
                                </SettingRow>

                                <SettingRow label={copy.account.password} description={copy.account.passwordDescription}>
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordModalOpen(true)}
                                        className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5 ${palette.primaryButton} ${palette.primaryButtonText}`}
                                    >
                                        <KeyRound size={18} strokeWidth={2.6} />
                                        {copy.account.changePassword}
                                    </button>
                                </SettingRow>

                                <SettingRow label={copy.account.countryRegion} description={copy.account.countryRegionDescription}>
                                    <SettingsSelect
                                        value={countryRegion}
                                        onChange={updateCountryRegion}
                                        options={countryOptions}
                                        palette={palette}
                                        label={copy.account.countryRegion}
                                    />
                                </SettingRow>

                                <SettingRow label={copy.account.useRegionLanguage} description={copy.account.useRegionLanguageDescription}>
                                    <SettingsToggle checked={useRegionLanguage} onChange={updateUseRegionLanguage} palette={palette} label={copy.account.useRegionLanguage} />
                                </SettingRow>

                                <SettingRow
                                    label={copy.account.appLanguage}
                                    description={useRegionLanguage ? copy.account.appLanguageControlledDescription : copy.account.appLanguageDescription}
                                >
                                    {useRegionLanguage ? (
                                        <div className={`flex min-w-64 items-center gap-3 rounded-2xl border ${palette.border} bg-slate-950/80 px-4 py-3 text-white shadow-xl backdrop-blur`}>
                                            <img src={selectedAppLanguage.flagUrl} alt="" className="h-6 w-9 rounded-md object-cover" />
                                            <div>
                                                <p className="text-sm font-black">{selectedAppLanguage.label}</p>
                                                <p className="text-xs font-semibold text-white/48">{copy.account.appLanguageControlledSummary}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <SettingsSelect
                                            value={manualAppLanguage}
                                            onChange={updateManualAppLanguage}
                                            options={appLanguageOptions}
                                            palette={palette}
                                            label={copy.account.appLanguage}
                                        />
                                    )}
                                </SettingRow>
                            </SettingsSection>
                        </div>

                        <div ref={element => { sectionRefs.current.gameplay = element }}>
                            <SettingsSection id="gameplay" title={copy.gameplay.title} description={copy.gameplay.description} palette={palette}>
                                <SettingRow label={copy.gameplay.defaultRoundLength} description={copy.gameplay.defaultRoundLengthDescription}>
                                    <SettingsSelect value={settings.defaultRoundLength} onChange={value => updateSetting("defaultRoundLength", value as DefaultRoundLength)} options={roundLengthOptions} palette={palette} label={copy.gameplay.defaultRoundLength} />
                                </SettingRow>
                                <SettingRow label={copy.gameplay.defaultGameDirection} description={copy.gameplay.defaultGameDirectionDescription}>
                                    <SettingsSelect value={settings.defaultGameDirection} onChange={value => updateSetting("defaultGameDirection", value as DefaultGameDirection)} options={gameDirectionOptions} palette={palette} label={copy.gameplay.defaultGameDirection} />
                                </SettingRow>
                                <SettingRow label={copy.gameplay.wrongAnswerRevealDuration} description={copy.gameplay.wrongAnswerRevealDurationDescription}>
                                    <SettingsSelect value={settings.wrongAnswerRevealDuration} onChange={value => updateSetting("wrongAnswerRevealDuration", value as WrongAnswerRevealDuration)} options={revealDurationOptions} palette={palette} label={copy.gameplay.wrongAnswerRevealDuration} />
                                </SettingRow>
                                <SettingRow label={copy.gameplay.autoFocusAnswerInput} description={copy.gameplay.autoFocusAnswerInputDescription}>
                                    <SettingsToggle checked={settings.autoFocusAnswerInput} onChange={value => updateSetting("autoFocusAnswerInput", value)} palette={palette} label={copy.gameplay.autoFocusAnswerInput} />
                                </SettingRow>
                                <SettingRow label={copy.gameplay.rushHourAutoSubmit} description={copy.gameplay.rushHourAutoSubmitDescription}>
                                    <SettingsToggle checked={settings.rushHourAutoSubmit} onChange={value => updateSetting("rushHourAutoSubmit", value)} palette={palette} label={copy.gameplay.rushHourAutoSubmit} />
                                </SettingRow>
                                <SettingRow label={copy.gameplay.accentHandling} description={copy.gameplay.accentHandlingDescription}>
                                    <SettingsSelect value={settings.accentHandling} onChange={value => updateSetting("accentHandling", value as AccentHandling)} options={accentHandlingOptions} palette={palette} label={copy.gameplay.accentHandling} />
                                </SettingRow>
                            </SettingsSection>
                        </div>

                        <div ref={element => { sectionRefs.current.audio = element }}>
                            <SettingsSection id="audio" title={copy.audio.title} description={copy.audio.description} palette={palette}>
                                <SettingRow label={copy.audio.masterVolume} description={copy.audio.masterVolumeDescription}>
                                    <SettingsSlider value={settings.masterVolume} onChange={value => updateSetting("masterVolume", value)} palette={palette} label={copy.audio.masterVolume} />
                                </SettingRow>
                                <SettingRow label={copy.audio.bgmVolume} description={copy.audio.bgmVolumeDescription}>
                                    <SettingsSlider value={settings.bgmVolume} onChange={value => updateSetting("bgmVolume", value)} palette={palette} label={copy.audio.bgmVolume} />
                                </SettingRow>
                                <SettingRow label={copy.audio.sfxVolume} description={copy.audio.sfxVolumeDescription}>
                                    <SettingsSlider value={settings.sfxVolume} onChange={value => updateSetting("sfxVolume", value)} palette={palette} label={copy.audio.sfxVolume} />
                                </SettingRow>
                                <SettingRow label={copy.audio.muteAll} description={copy.audio.muteAllDescription}>
                                    <SettingsToggle checked={settings.muteAll} onChange={value => updateSetting("muteAll", value)} palette={palette} label={copy.audio.muteAll} />
                                </SettingRow>
                                <SettingRow label={copy.audio.interfaceSounds} description={copy.audio.interfaceSoundsDescription}>
                                    <SettingsToggle checked={settings.interfaceSounds} onChange={value => updateSetting("interfaceSounds", value)} palette={palette} label={copy.audio.interfaceSounds} />
                                </SettingRow>
                                <SettingRow label={copy.audio.loginProfileLoadSound} description={copy.audio.loginProfileLoadSoundDescription}>
                                    <SettingsToggle checked={settings.loginProfileLoadSound} onChange={value => updateSetting("loginProfileLoadSound", value)} palette={palette} label={copy.audio.loginProfileLoadSound} />
                                </SettingRow>
                            </SettingsSection>
                        </div>

                        <div ref={element => { sectionRefs.current.comfort = element }}>
                            <SettingsSection id="comfort" title={copy.comfort.title} description={copy.comfort.description} palette={palette}>
                                <SettingRow label={copy.comfort.reduceAnimations} description={copy.comfort.reduceAnimationsDescription}>
                                    <SettingsToggle checked={settings.reduceAnimations} onChange={value => updateSetting("reduceAnimations", value)} palette={palette} label={copy.comfort.reduceAnimations} />
                                </SettingRow>
                                <SettingRow label={copy.comfort.reduceScreenFlashes} description={copy.comfort.reduceScreenFlashesDescription}>
                                    <SettingsToggle checked={settings.reduceScreenFlashes} onChange={value => updateSetting("reduceScreenFlashes", value)} palette={palette} label={copy.comfort.reduceScreenFlashes} />
                                </SettingRow>
                                <SettingRow label={copy.comfort.reduceGlowEffects} description={copy.comfort.reduceGlowEffectsDescription}>
                                    <SettingsToggle checked={settings.reduceGlowEffects} onChange={value => updateSetting("reduceGlowEffects", value)} palette={palette} label={copy.comfort.reduceGlowEffects} />
                                </SettingRow>
                                <SettingRow label={copy.comfort.largerText} description={copy.comfort.largerTextDescription}>
                                    <SettingsToggle checked={settings.largerText} onChange={updateLargerText} palette={palette} label={copy.comfort.largerText} />
                                </SettingRow>
                                <SettingRow label={copy.comfort.disableRushHourEffects} description={copy.comfort.disableRushHourEffectsDescription}>
                                    <SettingsToggle checked={settings.disableRushHourEffects} onChange={value => updateSetting("disableRushHourEffects", value)} palette={palette} label={copy.comfort.disableRushHourEffects} />
                                </SettingRow>
                            </SettingsSection>
                        </div>

                        <div ref={element => { sectionRefs.current.privacy = element }}>
                            <SettingsSection id="privacy" title={copy.privacy.title} description={copy.privacy.description} palette={palette}>
                                <SettingRow label={copy.privacy.showOtherCustomThemes} description={copy.privacy.showOtherCustomThemesDescription} disabled>
                                    <SettingsToggle checked={settings.showOtherCustomThemes} onChange={value => updateSetting("showOtherCustomThemes", value)} palette={palette} label={copy.privacy.showOtherCustomThemes} disabled />
                                </SettingRow>
                                <SettingRow label={copy.privacy.hideOtherCustomBackgrounds} description={copy.privacy.hideOtherCustomBackgroundsDescription} disabled>
                                    <SettingsToggle checked={settings.hideOtherCustomBackgrounds} onChange={value => updateSetting("hideOtherCustomBackgrounds", value)} palette={palette} label={copy.privacy.hideOtherCustomBackgrounds} disabled />
                                </SettingRow>
                                <SettingRow label={copy.privacy.hideOtherCustomAudio} description={copy.privacy.hideOtherCustomAudioDescription} disabled>
                                    <SettingsToggle checked={settings.hideOtherCustomAudio} onChange={value => updateSetting("hideOtherCustomAudio", value)} palette={palette} label={copy.privacy.hideOtherCustomAudio} disabled />
                                </SettingRow>
                                <SettingRow label={copy.privacy.allowLobbyFriendRequests} description={copy.privacy.allowLobbyFriendRequestsDescription} disabled>
                                    <SettingsToggle checked={settings.allowLobbyFriendRequests} onChange={value => updateSetting("allowLobbyFriendRequests", value)} palette={palette} label={copy.privacy.allowLobbyFriendRequests} disabled />
                                </SettingRow>
                            </SettingsSection>
                        </div>
                    </div>

                    <div className="sticky bottom-6 z-20 mt-8 flex items-center justify-end gap-4 rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 shadow-2xl backdrop-blur-xl">
                        {savedMessage && <p className="text-sm font-semibold text-white/62">{savedMessage}</p>}
                        <button
                            type="button"
                            onClick={handleSave}
                            className={`inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5 ${palette.primaryButton} ${palette.primaryButtonText}`}
                        >
                            <Save size={18} strokeWidth={2.6} />
                            {copy.saveChanges}
                        </button>
                    </div>
                </AppPageShell>
            </PageContentTransition>
        </>
    )
}