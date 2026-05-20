import { Lock, Mail } from "lucide-react"
import AuthInput from "./AuthInput"
import AuthPrimaryButton from "./AuthPrimaryButton"

interface SignupStepAccountProps {
    email: string
    password: string
    confirmPassword: string
    error: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onConfirmPasswordChange: (value: string) => void
    onNext: () => void
}

export default function SignupStepAccount({ email, password, confirmPassword, error, onEmailChange, onPasswordChange, onConfirmPasswordChange, onNext }: SignupStepAccountProps) {
    return (
        <div className="mx-auto w-full max-w-md space-y-5">
            <AuthInput label="Email" type="email" value={email} onChange={onEmailChange} placeholder="you@example.com" autoComplete="email" icon={<Mail size={20} strokeWidth={2.4} />} />
            <AuthInput label="Password" type="password" value={password} onChange={onPasswordChange} placeholder="Password" autoComplete="new-password" icon={<Lock size={20} strokeWidth={2.4} />} />
            <AuthInput label="Confirm password" type="password" value={confirmPassword} onChange={onConfirmPasswordChange} placeholder="Confirm password" autoComplete="new-password" icon={<Lock size={20} strokeWidth={2.4} />} />
            {error && <p className="text-sm font-semibold text-red-200">{error}</p>}
            <div className="flex justify-center pt-2">
                <AuthPrimaryButton text="Next" ariaLabel="Next sign up step" onClick={onNext} />
            </div>
        </div>
    )
}
