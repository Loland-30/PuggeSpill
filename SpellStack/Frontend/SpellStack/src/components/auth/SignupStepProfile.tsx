import { Camera, User } from "lucide-react"
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
    onProfileImageChange: (value: string | null) => void
    onNext: () => void
}

export default function SignupStepProfile({ username, countryCode, profileImagePreview, countries, error, onUsernameChange, onCountryChange, onProfileImageChange, onNext }: SignupStepProfileProps) {
    const selectedCountry = countries.find(country => country.code === countryCode) ?? countries[0]

    const handleFileChange = (file: File | undefined) => {
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            if (typeof reader.result === "string") onProfileImageChange(reader.result)
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="mx-auto w-full max-w-md space-y-5">
            <div className="flex flex-col items-center gap-3">
                <label className="group relative grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-2xl transition hover:border-white/55">
                    {profileImagePreview ? (
                        <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                        <Camera size={30} strokeWidth={2.4} className="text-white/70" />
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/55 py-2 text-center text-xs font-black text-white opacity-0 transition group-hover:opacity-100">
                        Upload
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={event => handleFileChange(event.target.files?.[0])} />
                </label>
                {profileImagePreview && (
                    <button type="button" onClick={() => onProfileImageChange(null)} className="text-xs font-bold text-white/55 transition hover:text-white">
                        Remove image
                    </button>
                )}
            </div>

            <AuthInput label="Username" value={username} onChange={onUsernameChange} placeholder="Username" autoComplete="username" icon={<User size={20} strokeWidth={2.4} />} />

            <label className="block">
                <span className="mb-2 block text-sm font-black text-white/86">Country / region</span>
                <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-slate-950 shadow-xl ring-1 ring-white/20">
                    <span className="text-xl">{selectedCountry.flag}</span>
                    <select
                        value={countryCode}
                        onChange={event => onCountryChange(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none"
                    >
                        {countries.map(country => (
                            <option key={country.code} value={country.code}>{country.flag} {country.name}</option>
                        ))}
                    </select>
                </span>
            </label>

            {error && <p className="text-sm font-semibold text-red-200">{error}</p>}
            <div className="flex justify-center pt-2">
                <AuthPrimaryButton text="Next" ariaLabel="Next sign up step" onClick={onNext} />
            </div>
        </div>
    )
}
