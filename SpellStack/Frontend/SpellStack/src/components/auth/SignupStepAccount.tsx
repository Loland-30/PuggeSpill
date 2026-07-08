import { Lock, Mail } from "lucide-react"
import type { FormEvent } from "react"
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
    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        onNext()
    }

    return (
        <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-[28rem] space-y-6">
            <AuthInput label="E-mail" type="email" value={email} onChange={onEmailChange} placeholder="Your e-mail" autoComplete="email" icon={<Mail size={24} strokeWidth={2.1} />} />
            <AuthInput label="Enter password" type="password" value={password} onChange={onPasswordChange} placeholder="Your password" autoComplete="new-password" icon={<Lock size={24} strokeWidth={2.1} />} />
            <AuthInput label="Confirm password" type="password" value={confirmPassword} onChange={onConfirmPasswordChange} placeholder="Your password" autoComplete="new-password" icon={<Lock size={24} strokeWidth={2.1} />} />
            {error && <p className="text-center text-sm font-semibold text-red-200">{error}</p>}
            <div className="flex justify-center pt-10">
                <AuthPrimaryButton type="submit" text="Next" ariaLabel="Next sign up step" />
            </div>
        </form>
    )
}
