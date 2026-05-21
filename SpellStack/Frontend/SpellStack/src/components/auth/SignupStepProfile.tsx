import { Camera, User } from "lucide-react"
import AuthBackButton from "./AuthBackButton"
import AuthCountrySelect from "./AuthCountrySelect"
import AuthInput from "./AuthInput"
import AuthPrimaryButton from "./AuthPrimaryButton"

export interface AuthCountryOption {
    code: string
    name: string
    flag: string
}

interface SignupStepProfileProps {
    username: string
    countryCode: string
    profileImagePreview: string | null
    countries: AuthCountryOption[]
    error: string
    onUsernameChange: (value: string) => void
    onCountryChange: (value: string) => void
    onProfileImageChange: (preview: string | null, file: File | null) => void
    onBack: () => void
    onNext: () => void
}

export default function SignupStepProfile({ username, countryCode, profileImagePreview, countries, error, onUsernameChange, onCountryChange, onProfileImageChange, onBack, onNext }: SignupStepProfileProps) {
    const handleFileChange = (file: File | undefined) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === "string") onProfileImageChange(reader.result, file)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="mx-auto w-full max-w-[28rem] space-y-7">
            <div className="flex flex-col items-center gap-4">
                <label className="group relative grid h-36 w-36 cursor-pointer place-items-center overflow-hidden rounded-full bg-white text-slate-950 shadow-2xl transition hover:scale-[1.02]">
                    {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                        <Camera size={34} strokeWidth={2.2} className="text-slate-500 opacity-0 transition group-hover:opacity-100" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={event => handleFileChange(event.target.files?.[0])} />
                </label>
                <p className="text-sm font-medium text-white/82">Add a profile picture (Optional)</p>
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-white/82">Enter Username</p>
                <AuthInput hideLabel label="Username" value={username} onChange={onUsernameChange} placeholder="Your Username" autoComplete="username" icon={<User size={24} strokeWidth={2.1} />} />
            </div>

            <div>
                <p className="mb-2 text-sm font-medium text-white/82">Where are you from?</p>
                <AuthCountrySelect value={countryCode} countries={countries} onChange={onCountryChange} />
            </div>

            {error && <p className="text-center text-sm font-semibold text-red-200">{error}</p>}
            <div className="flex justify-center gap-8 pt-6">
                <AuthBackButton onClick={onBack} ariaLabel="Back to account step" />
                <AuthPrimaryButton text="Next" ariaLabel="Next sign up step" onClick={onNext} />
            </div>
        </div>
    )
}
