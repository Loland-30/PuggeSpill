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
        <div className="mx-auto w-full max-w-3xl text-white">
            <div className="flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-12">
                <div className="grid h-44 w-44 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-6xl font-black text-slate-950 shadow-[0_0_42px_rgba(255,255,255,0.16)]">
                    {profileImagePreview ? <img src={profileImagePreview} alt="Profile preview" className="h-full w-full object-cover" /> : username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 text-center sm:text-left">
                    <p className="flex flex-wrap items-center justify-center gap-4 text-5xl font-black tracking-tight sm:justify-start">
                        <span className="truncate">{username}</span>
                        <span className="text-4xl">{country.flag}</span>
                    </p>
                    <p className="mt-3 truncate text-xl font-medium text-white/80">{email}</p>
                    <p className="mt-5 text-base font-medium text-white/64">{country.name}</p>
                </div>
            </div>

            {error && <p className="mt-8 text-center text-sm font-semibold text-red-200">{error}</p>}
            <div className="mt-20 flex justify-center">
                <AuthPrimaryButton text="Create Account" ariaLabel="Create account" onClick={onSubmit} loading={loading} variant="pill" />
            </div>
            <p className="mt-6 text-center text-sm leading-5 text-white/70">
                By creating an account, you agree to the Terms of Service and Privacy Policy.
            </p>
        </div>
    )
}
