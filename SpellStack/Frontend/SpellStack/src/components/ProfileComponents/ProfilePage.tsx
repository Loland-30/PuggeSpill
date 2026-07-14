import { useTheme } from "../../theme/ThemeContext"
import GradientFrame from "../GradientFrame"
import ProfileImage from "../ProfileImage"
import type { ProfileComponentProps } from "./types"
import { useI18n } from "../../i18n/I18nContext"
import { LogOut } from "lucide-react"

const learningLanguageLabels = {
    en: "Learning language",
    no: "Læringsspråk",
    es: "Idioma de aprendizaje",
    ja: "学習言語"
} as const

export default function ProfilePage({
    user,
    profileImage,
    createdAt,
    favoriteLanguageFlag,
    profileRegionLabel,
    profileLanguages,
    currentLanguage,
    onSelectLanguage,
    onProfileImageUpload,
    onProfileImageRemove,
    onLogout,
    profileImageError
}: ProfileComponentProps) {
    const { appLanguage, t } = useI18n()
    const learningLanguageLabel = learningLanguageLabels[appLanguage]

    return (
        <div className="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-[102rem] items-center justify-center px-0 py-8 sm:px-6">
            <div className="w-full max-w-7xl">
                <section className="flex flex-col justify-start gap-6 md:flex-row md:items-center">
                    <div className="flex flex-col items-center gap-3">
                        <label className="group relative grid h-32 w-32 cursor-pointer place-items-center overflow-hidden rounded-full text-5xl font-black shadow-2xl transition hover:scale-105">
                            <AvatarLetter username={user.username} />
                            <ProfileImage
                                src={profileImage}
                                alt={`${user.username} profile`}
                                className="absolute inset-0 h-full w-full object-cover"
                            />

                            <span className="absolute inset-x-0 bottom-0 bg-black/60 py-2 text-center text-xs font-bold opacity-0 transition group-hover:opacity-100">
                                Change
                            </span>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={event => onProfileImageUpload(event.target.files?.[0])}
                                className="hidden"
                            />
                        </label>

                        {profileImage && (
                            <button
                                type="button"
                                onClick={onProfileImageRemove}
                                className="rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                            >
                                Remove image
                            </button>
                        )}

                        {profileImageError && (
                            <p className="max-w-48 text-center text-sm font-semibold text-red-200">
                                {profileImageError}
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start md:gap-4">
                            <h1 className="break-all text-center text-3xl font-black sm:text-5xl md:text-left">{user.username}</h1>

                            {favoriteLanguageFlag && (
                                <img
                                    src={favoriteLanguageFlag}
                                    alt={profileRegionLabel ? `${profileRegionLabel} flag` : "Profile region flag"}
                                    className="h-10 w-14 rounded-lg object-cover shadow-lg"
                                />
                            )}
                        </div>

                        <p className="mt-2 text-center text-xl text-white/85 sm:text-2xl md:text-left">
                            {learningLanguageLabel}: {currentLanguage.label}
                        </p>

                        <p className="mt-4 text-center text-white/70 md:text-left">
                            Account created: {createdAt}
                        </p>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm font-bold text-white/80 shadow-lg transition hover:border-white/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:mx-0 min-[1400px]:hidden"
                        >
                            <LogOut size={17} strokeWidth={2.5} aria-hidden="true" />
                            {t.nav.signOut}
                        </button>
                    </div>
                </section>

                <section className="mt-12 sm:mt-24">
                    <h2 className="text-3xl font-black sm:text-4xl">Stats</h2>

                    <div className="mt-6 flex flex-wrap gap-4 text-lg text-white/80">
                        {profileLanguages.map(language => {
                            const active = language.code === currentLanguage.code

                            return (
                                <button
                                    key={language.code}
                                    type="button"
                                    onClick={() => onSelectLanguage(language.code)}
                                    className={`flex items-center gap-2 rounded-full border px-4 py-2 font-semibold transition ${
                                        active
                                            ? "border-white/40 bg-white/15 text-white"
                                            : "border-transparent bg-black/20 text-white/70 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {language.flagUrl && (
                                        <img
                                            src={language.flagUrl}
                                            alt={`${language.label} flag`}
                                            className="h-6 w-9 rounded-md object-cover shadow-lg"
                                        />
                                    )}

                                    {language.label}
                                </button>
                            )
                        })}

                        {profileLanguages.length === 0 && (
                            <span className="text-white/60">No learning languages yet</span>
                        )}
                    </div>

                    <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
                        <ProfileStat label="Runs played" value={currentLanguage.stats.runsPlayed} />
                        <ProfileStat label="Longest streak" value={currentLanguage.stats.longestStreak} />
                        <ProfileStat label="Words learned" value={currentLanguage.stats.wordsLearned} />
                    </div>
                </section>
            </div>
        </div>
    )
}

function AvatarLetter({ username }: { username: string }) {
    const { palette } = useTheme()

    return (
        <span className={`grid h-full w-full place-items-center ${palette.primaryButton} ${palette.primaryButtonText}`}>
            {username.slice(0, 1).toUpperCase()}
        </span>
    )
}

function ProfileStat({ label, value }: { label: string; value: number }) {
    return (
        <GradientFrame radius={18} radiusClass="rounded-[18px]" glow contentClassName="px-8 py-10 text-center">
            <p className="text-xl font-semibold text-white/90">{label}:</p>
            <p className="mt-4 text-4xl font-black">{value}</p>
        </GradientFrame>
    )
}
