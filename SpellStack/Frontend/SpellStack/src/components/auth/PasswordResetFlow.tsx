import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
    completePasswordReset,
    requestPasswordReset,
    verifyPasswordResetCode
} from "../../api/auth"
import { estimatePasswordStrength } from "../../utils/passwordStrength"
import AuthBackButton from "./AuthBackButton"
import AuthBrandTitle from "./AuthBrandTitle"
import AuthInput from "./AuthInput"
import AuthPrimaryButton from "./AuthPrimaryButton"

type PasswordResetStep = "request" | "verify" | "new-password" | "success"

interface PasswordResetFlowProps {
    email: string
    onEmailChange: (value: string) => void
    onBackToSignIn: () => void
}

const transition = {
    duration: 0.22,
    ease: "easeOut" as const
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function PasswordResetFlow({
    email,
    onEmailChange,
    onBackToSignIn
}: PasswordResetFlowProps) {
    const reducedMotion = useReducedMotion()
    const [step, setStep] = useState<PasswordResetStep>("request")
    const [code, setCode] = useState("")
    const [resetToken, setResetToken] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [resendSeconds, setResendSeconds] = useState(0)
    const codeInputRef = useRef<HTMLInputElement>(null)
    const passwordInputRef = useRef<HTMLInputElement>(null)
    const successHeadingRef = useRef<HTMLHeadingElement>(null)

    const strength = useMemo(
        () => estimatePasswordStrength(newPassword, [email]),
        [email, newPassword]
    )
    const passwordsMatch = Boolean(newPassword) && newPassword === confirmPassword

    useEffect(() => {
        if (resendSeconds <= 0) return
        const timer = window.setInterval(() => {
            setResendSeconds(current => Math.max(0, current - 1))
        }, 1000)
        return () => window.clearInterval(timer)
    }, [resendSeconds])

    useEffect(() => {
        if (step === "verify") codeInputRef.current?.focus()
        if (step === "new-password") passwordInputRef.current?.focus()
        if (step === "success") successHeadingRef.current?.focus()
    }, [step])

    const clearFeedback = () => {
        setError("")
    }

    const leaveResetFlow = () => {
        setCode("")
        setResetToken("")
        setNewPassword("")
        setConfirmPassword("")
        clearFeedback()
        onBackToSignIn()
    }

    const sendCode = async () => {
        clearFeedback()
        if (!isValidEmail(email.trim())) {
            setError("Enter a valid email address.")
            return
        }

        setLoading(true)
        try {
            const result = await requestPasswordReset(email.trim())
            setResendSeconds(result.retryAfterSeconds)
            setStep("verify")
        } catch (requestError) {
            setError(requestError instanceof Error
                ? requestError.message
                : "Could not send a reset code.")
        } finally {
            setLoading(false)
        }
    }

    const verifyCode = async () => {
        clearFeedback()
        const normalizedCode = code.trim()
        if (!/^\d{6}$/.test(normalizedCode)) {
            setError("Enter the six-digit verification code.")
            return
        }

        setLoading(true)
        try {
            const authorization = await verifyPasswordResetCode(
                email.trim(),
                normalizedCode
            )
            setResetToken(authorization)
            setCode("")
            setStep("new-password")
        } catch (verifyError) {
            setError(verifyError instanceof Error
                ? verifyError.message
                : "The code is invalid or expired.")
        } finally {
            setLoading(false)
        }
    }

    const resetPassword = async () => {
        clearFeedback()
        if (!strength.meetsMinimum) {
            setError("Password is too weak.")
            return
        }
        if (!passwordsMatch) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)
        try {
            await completePasswordReset(resetToken, newPassword)
            setNewPassword("")
            setConfirmPassword("")
            setResetToken("")
            setStep("success")
        } catch (resetError) {
            const message = resetError instanceof Error
                ? resetError.message
                : "Could not update your password."
            if (message === "Your reset authorization is invalid or expired.") {
                setNewPassword("")
                setConfirmPassword("")
                setResetToken("")
                setStep("request")
            }
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (loading) return
        if (step === "request") void sendCode()
        if (step === "verify") void verifyCode()
        if (step === "new-password") void resetPassword()
    }

    const resendCode = async () => {
        if (resendSeconds > 0 || loading) return
        await sendCode()
    }

    const passwordToggle = (
        visible: boolean,
        toggle: () => void,
        label: string
    ) => (
        <button
            type="button"
            onClick={toggle}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/75 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            aria-label={`${visible ? "Hide" : "Show"} ${label}`}
        >
            {visible ? <EyeOff aria-hidden="true" size={21} /> : <Eye aria-hidden="true" size={21} />}
        </button>
    )

    const motionProps = reducedMotion
        ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
        : {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -10 },
            transition
        }
    const flowKey = step === "request" || step === "verify"
        ? "code"
        : step

    return (
        <div className="mx-auto w-full max-w-[28rem]">
            <AuthBrandTitle />
            <AnimatePresence mode="wait" initial={false}>
                <motion.div key={flowKey} {...motionProps}>
                    {step === "success" ? (
                        <section className="text-center" aria-live="polite">
                            <CheckCircle2
                                aria-hidden="true"
                                className="mx-auto text-white"
                                size={54}
                                strokeWidth={1.7}
                            />
                            <h2
                                ref={successHeadingRef}
                                tabIndex={-1}
                                className="mt-6 text-3xl font-bold outline-none"
                            >
                                Password updated
                            </h2>
                            <p className="mt-3 text-white/75">
                                Your password has been changed successfully.
                            </p>
                            <button
                                type="button"
                                onClick={leaveResetFlow}
                                className="mt-10 min-h-12 rounded-full bg-white px-8 font-bold text-slate-950 transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                            >
                                Back to sign in
                            </button>
                        </section>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate>
                            {step === "new-password" && (
                                <h2 className="mb-7 text-center text-2xl font-bold">
                                    Create a new password
                                </h2>
                            )}

                            {(step === "request" || step === "verify") && (
                                <AuthInput
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={onEmailChange}
                                    placeholder="Your email"
                                    autoComplete="email"
                                    icon={<Mail aria-hidden="true" size={24} />}
                                    readOnly={step === "verify"}
                                    errorId={error ? "password-reset-error" : undefined}
                                />
                            )}

                            <AnimatePresence initial={false}>
                                {step === "verify" && (
                                    <motion.div
                                        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={reducedMotion ? { duration: 0 } : transition}
                                        className="mt-5"
                                    >
                                        <AuthInput
                                            ref={codeInputRef}
                                            label="Enter code"
                                            value={code}
                                            onChange={value => setCode(value.replace(/\D/g, "").slice(0, 6))}
                                            placeholder="Enter code"
                                            autoComplete="one-time-code"
                                            inputMode="numeric"
                                            maxLength={6}
                                            icon={<KeyRound aria-hidden="true" size={24} />}
                                            labelAction={(
                                                <button
                                                    type="button"
                                                    onClick={() => void resendCode()}
                                                    disabled={loading || resendSeconds > 0}
                                                    className="shrink-0 text-sm font-semibold text-white/78 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {resendSeconds > 0
                                                        ? `Resend code (${resendSeconds}s)`
                                                        : "Resend code"}
                                                </button>
                                            )}
                                            errorId={error ? "password-reset-error" : undefined}
                                        />
                                        <p
                                            className="mt-4 break-words text-center text-sm font-medium text-white/76"
                                            aria-live="polite"
                                        >
                                            A code has been sent to{" "}
                                            <strong className="text-white">{email}</strong>
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {step === "new-password" && (
                                <div className="space-y-5">
                                    <AuthInput
                                        ref={passwordInputRef}
                                        label="New password"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        placeholder="New password"
                                        autoComplete="new-password"
                                        icon={<Lock aria-hidden="true" size={24} />}
                                        trailing={passwordToggle(
                                            showNewPassword,
                                            () => setShowNewPassword(value => !value),
                                            "new password"
                                        )}
                                        errorId={error ? "password-reset-error" : undefined}
                                    />
                                    <AuthInput
                                        label="Confirm password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        placeholder="Confirm password"
                                        autoComplete="new-password"
                                        icon={<Lock aria-hidden="true" size={24} />}
                                        trailing={passwordToggle(
                                            showConfirmPassword,
                                            () => setShowConfirmPassword(value => !value),
                                            "confirmed password"
                                        )}
                                        errorId={error ? "password-reset-error" : undefined}
                                    />

                                    <div className="pt-1" aria-label={`Password strength: ${strength.label}`}>
                                        <p className="text-sm font-semibold text-white">
                                            {strength.meetsMinimum
                                                ? "Minimum strength reached"
                                                : "Password is too weak"}
                                        </p>
                                        <div
                                            className="mt-3 grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_3.5rem] items-start"
                                            aria-hidden="true"
                                        >
                                            {["Weak", "Fair", "Strong", "Very strong"].flatMap((label, index) => {
                                                const items = [
                                                    <div key={label} className="relative z-10 text-center">
                                                        <span className={`mx-auto block h-4 w-4 rounded-full border border-white transition-colors ${
                                                            strength.level >= index + 1
                                                                ? "bg-white"
                                                                : "bg-black/45"
                                                        }`} />
                                                        <span className="mt-2 block text-[0.68rem] text-white/68 sm:text-xs">
                                                            {label}
                                                        </span>
                                                    </div>
                                                ]
                                                if (index < 3) {
                                                    items.push(
                                                        <span
                                                            key={`${label}-line`}
                                                            className={`mt-[0.45rem] h-0.5 transition-colors ${
                                                                strength.level >= index + 2
                                                                    ? "bg-white"
                                                                    : "bg-white/35"
                                                            }`}
                                                        />
                                                    )
                                                }
                                                return items
                                            })}
                                        </div>
                                        {confirmPassword && !passwordsMatch && (
                                            <p className="mt-3 text-sm font-medium text-red-200">
                                                Passwords do not match.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="min-h-8" aria-live="polite" aria-atomic="true">
                                {error && (
                                    <p id="password-reset-error" className="mt-4 text-center text-sm font-semibold text-red-200">
                                        {error}
                                    </p>
                                )}
                            </div>

                            <div className="mt-7 flex justify-center gap-8">
                                {step !== "request" && (
                                    <AuthBackButton
                                        onClick={leaveResetFlow}
                                        ariaLabel="Back to sign in"
                                        text="Back to sign in"
                                    />
                                )}
                                <AuthPrimaryButton
                                    type="submit"
                                    text={
                                        step === "request"
                                            ? "Send code"
                                            : step === "verify"
                                                ? "Verify code"
                                                : "Reset password"
                                    }
                                    ariaLabel={
                                        step === "request"
                                            ? "Send password reset code"
                                            : step === "verify"
                                                ? "Verify password reset code"
                                                : "Reset password"
                                    }
                                    loading={loading}
                                    wide={step === "new-password"}
                                    disabled={
                                        (step === "request" && !email) ||
                                        (step === "verify" && code.length !== 6) ||
                                        (step === "new-password" &&
                                            (!strength.meetsMinimum || !passwordsMatch || !resetToken))
                                    }
                                />
                            </div>
                        </form>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
