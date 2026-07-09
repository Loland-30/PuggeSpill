import { motion } from "framer-motion"
import { Lock, Mail } from "lucide-react"
import type { FormEvent } from "react"
import AuthBrandTitle from "./AuthBrandTitle"
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
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!loading && email && password) onSubmit()
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mx-auto w-full max-w-[28rem]"
        >
            <form onSubmit={handleSubmit} noValidate>
                <AuthBrandTitle subtitle="Vocabulary practice, stacked." />
                <div className="space-y-7">
                    <AuthInput hideLabel label="Email" type="email" value={email} onChange={onEmailChange} placeholder="Your email" autoComplete="email" icon={<Mail size={24} strokeWidth={2.1} />} />
                    <AuthInput hideLabel label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="********" autoComplete="current-password" icon={<Lock size={24} strokeWidth={2.1} />} />
                </div>

                <div className="mt-8 flex items-center justify-between gap-4 text-base font-medium text-white/90">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={event => onRememberMeChange(event.target.checked)}
                            className="h-6 w-6 rounded-md border-white/20 bg-white accent-white"
                        />
                        Remember me
                    </label>
                    <button type="button" onClick={onForgotPassword} disabled={loading} className="transition hover:text-white disabled:opacity-45">
                        Forgot password
                    </button>
                </div>

                {error && <p className="mt-5 text-center text-sm font-semibold text-red-200">{error}</p>}
                {message && <p className="mt-5 text-center text-sm font-semibold text-green-200">{message}</p>}

                <div className="mt-16 flex justify-center">
                    <AuthPrimaryButton type="submit" text="Sign in" ariaLabel="Sign in" loading={loading} disabled={!email || !password} variant="pill" />
                </div>
            </form>
        </motion.div>
    )
}
