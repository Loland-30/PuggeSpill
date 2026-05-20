import type { AuthUser, LanguageStats } from "../../api/auth"
import type { Language } from "../../data/languages"

export interface ProfileLanguage extends Language {
    stats: LanguageStats
}

export interface ProfileComponentProps {
    user: AuthUser
    profileImage: string | null
    createdAt: string
    favoriteLanguageFlag?: string
    profileRegionLabel?: string
    profileLanguages: ProfileLanguage[]
    currentLanguage: ProfileLanguage
    onSelectLanguage: (code: string) => void
    onProfileImageUpload: (file: File | undefined) => void
}
