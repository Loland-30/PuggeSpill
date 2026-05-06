import { useTheme } from "../../theme/ThemeContext"
import GradientFrame from "../GradientFrame"
import type { ProfileComponentProps } from "./types"

export default function ProfilePage({
    user,
    profileImage,
    createdAt,
    favoriteLanguageFlag,
    profileLanguages,
    currentLanguage,
    onSelectLanguage,
    onProfileImageUpload
}: ProfileComponentProps) {
    return (
        <div className="mx-auto w-full max-w-7xl px-6">
            <section className="mt-24 flex flex-col gap-6 md:mt-32 md:flex-row md:items-center">
                <label className="group relative grid h-32 w-32 cursor-pointer place-items-center overflow-hidden rounded-full text-5xl font-black shadow-2xl transition hover:scale-105">
                    {profileImage ? (
                        <img
                            src={profileImage}
                            alt={`${user.username} profile`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <AvatarLetter username={user.username} />
                    )}

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

                <div>
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-5xl font-black">{user.username}</h1>

                        {favoriteLanguageFlag && (
                            <img
                                src={favoriteLanguageFlag}
                                alt={`${user.favoriteLanguage} flag`}
                                className="h-10 w-14 rounded-lg object-cover shadow-lg"
                            />
                        )}
                    </div>

                    <p className="mt-2 text-2xl text-white/85">
                        Favorite language: {user.favoriteLanguage}
                    </p>

                    <p className="mt-4 text-white/70">
                        Account created: {createdAt}
                    </p>
                </div>
            </section>

            <section className="mt-24">
                <h2 className="text-4xl font-black">Stats</h2>

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

                <div className="mt-10 grid gap-8 md:grid-cols-3">
                    <ProfileStat label="Runs played" value={currentLanguage.stats.runsPlayed} />
                    <ProfileStat label="Longest streak" value={currentLanguage.stats.longestStreak} />
                    <ProfileStat label="Words learned" value={currentLanguage.stats.wordsLearned} />
                </div>
            </section>
        </div>
    )
}

function AvatarLetter({ username }: { username: string }) {
    const { palette } = useTheme()

    return (
        <span className={`grid h-full w-full place-items-center ${palette.primaryButton}`}>
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