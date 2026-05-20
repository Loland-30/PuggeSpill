import AuthPrimaryButton from "./AuthPrimaryButton"
import type { AuthCountryOption } from "./SignupStepProfile"

interface SignupStepSummaryProps {
    username: string
    email: string
    country: AuthCountryOption
    profileImagePreview: string | null
    loading: boolean
    error: string
    onSubmit: () => void
}

export default function SignupStepSummary({ username, email, country, profileImagePreview, loading, error, onSubmit }: SignupStepSummaryProps) {
    return (
        <div className="mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/12 bg-white/[0.07] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:text-left">
                    <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-4xl font-black text-slate-950 shadow-[0_0_32px_rgba(255,255,255,0.18)]">
                        {profileImagePreview ? <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" /> : username.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 text-center sm:text-left">
                        <p className="truncate text-3xl font-black text-white">{username}</p>
                        <p className="mt-2 truncate text-sm font-semibold text-white/62">{email}</p>
                        <p className="mt-3 text-base font-bold text-white/82">{country.flag} {country.name}</p>
                    </div>
                </div>
                <p className="mt-6 text-center text-xs leading-5 text-white/45">
                    By creating an account, you agree to the Terms of Service and Privacy Policy.
                </p>
            </div>

            {error && <p className="mt-4 text-center text-sm font-semibold text-red-200">{error}</p>}
            <div className="mt-6 flex justify-center">
                <AuthPrimaryButton text="Create Account" ariaLabel="Create account" onClick={onSubmit} loading={loading} variant="pill" />
            </div>
        </div>
    )
}
