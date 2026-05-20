import { Lock, Mail } from "lucide-react"
import AuthInput from "./AuthInput"
import AuthPrimaryButton from "./AuthPrimaryButton"

interface LoginFormProps {
    email: string
    password: string
    rememberMe: boolean
    loading: boolean
    error: string
    message: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onRememberMeChange: (value: boolean) => void
    onForgotPassword: () => void
    onSubmit: () => void
}

export default function LoginForm({ email, password, rememberMe, loading, error, message, onEmailChange, onPasswordChange, onRememberMeChange, onForgotPassword, onSubmit }: LoginFormProps) {
    return (
        <div className="mx-auto w-full max-w-md">
            <div className="mb-10 text-center">
                <p className="text-sm font-black uppercase tracking-[0.35em] text-white/45">SpellStack</p>
                <h1 className="mt-4 text-5xl font-black tracking-tight text-white">Sign in</h1>
            </div>

            <div className="space-y-5">
                <AuthInput label="Email" type="email" value={email} onChange={onEmailChange} placeholder="you@example.com" autoComplete="email" icon={<Mail size={20} strokeWidth={2.4} />} />
                <AuthInput label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="Password" autoComplete="current-password" icon={<Lock size={20} strokeWidth={2.4} />} />
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm font-semibold text-white/62">
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={event => onRememberMeChange(event.target.checked)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10 accent-white"
                    />
                    Remember me
                </label>
                <button type="button" onClick={onForgotPassword} disabled={loading} className="transition hover:text-white disabled:opacity-45">
                    Forgot password?
                </button>
            </div>

            {error && <p className="mt-5 text-sm font-semibold text-red-200">{error}</p>}
            {message && <p className="mt-5 text-sm font-semibold text-green-200">{message}</p>}

            <div className="mt-8 flex justify-center">
                <AuthPrimaryButton text="Sign in" ariaLabel="Sign in" onClick={onSubmit} loading={loading} disabled={!email || !password} variant="pill" />
            </div>
        </div>
    )
}
