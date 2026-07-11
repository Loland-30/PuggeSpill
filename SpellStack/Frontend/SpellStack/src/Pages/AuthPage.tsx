import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { requestPasswordReset } from "../api/auth"
import { useAuth } from "../auth/AuthContext"
import AuthShell from "../components/auth/AuthShell"
import AuthWelcomeSplash from "../components/auth/AuthWelcomeSplash"
import LoginForm from "../components/auth/LoginForm"
import SignupFlow from "../components/auth/SignupFlow"
import type { AuthCountryOption } from "../components/auth/SignupStepProfile"
import { countries, getCountryFlag, getCountryName } from "../data/countries"
import { resolveAssetUrl } from "../utils/assetUrl"

const welcomeDelayMs = 1200
const welcomeExitMs = 260
const countryOptions: AuthCountryOption[] = countries
    .map(country => ({
        code: country.code,
        name: getCountryName(country.code, "en"),
        flag: getCountryFlag(country.code)
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "en"))

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function AuthPage() {
    const navigate = useNavigate()
    const { loginUser, registerUser, uploadProfileImage } = useAuth()
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [username, setUsername] = useState("")
    const [countryCode, setCountryCode] = useState("NO")
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [rememberMe, setRememberMe] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [welcome, setWelcome] = useState<{
        variant: "login" | "register"
        username: string
        avatarUrl: string | null
        soundUrl: string | null
    } | null>(null)

    const changeMode = (nextMode: "login" | "signup") => {
        setError("")
        setMessage("")
        setMode(nextMode)
        if (nextMode === "signup") setSignupStep(1)
    }

    const finishWithSplash = (
        variant: "login" | "register",
        name: string,
        avatarUrl: string | null,
        soundUrl: string | null
    ) => {
        setWelcome({ variant, username: name, avatarUrl, soundUrl })
        window.setTimeout(() => {
            setWelcome(null)
            window.setTimeout(() => navigate("/decks"), welcomeExitMs)
        }, welcomeDelayMs)
    }

    const validateAccountStep = () => {
        setError("")
        if (!isValidEmail(email)) {
            setError("Enter a valid email address.")
            return false
        }
        if (!password) {
            setError("Enter a password.")
            return false
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return false
        }
        return true
    }

    const validateProfileStep = () => {
        setError("")
        if (!username.trim()) {
            setError("Choose a username.")
            return false
        }
        return true
    }

    const handleProfileImageChange = (preview: string | null, file: File | null) => {
        setProfileImagePreview(preview)
        setProfileImageFile(file)
    }

    const handleLogin = async () => {
        setError("")
        setMessage("")
        setSubmitting(true)

        try {
            const user = await loginUser(email, password)
            finishWithSplash(
                "login",
                user.username,
                resolveAssetUrl(user.profileImageUrl),
                resolveAssetUrl(user.customLoginSplashSoundUrl)
            )
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    const handleRegister = async () => {
        if (!validateAccountStep() || !validateProfileStep()) return

        setError("")
        setMessage("")
        setSubmitting(true)

        try {
            const user = await registerUser(username.trim(), email, password, "es", countryCode)

            const userWithImage = profileImageFile
                ? await uploadProfileImage(profileImageFile)
                : user

            finishWithSplash(
                "register",
                userWithImage.username,
                resolveAssetUrl(userWithImage.profileImageUrl),
                resolveAssetUrl(userWithImage.customLoginSplashSoundUrl)
            )
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    const handleForgotPassword = async () => {
        setError("")
        setMessage("")

        if (!email) {
            setError("Enter your email first.")
            return
        }

        setSubmitting(true)
        try {
            const result = await requestPasswordReset(email)
            setMessage(result)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <AuthShell mode={mode} onModeChange={changeMode}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="w-full"
                    >
                        {mode === "login" ? (
                            <LoginForm
                                email={email}
                                password={password}
                                rememberMe={rememberMe}
                                loading={submitting}
                                error={error}
                                message={message}
                                onEmailChange={setEmail}
                                onPasswordChange={setPassword}
                                onRememberMeChange={setRememberMe}
                                onForgotPassword={handleForgotPassword}
                                onSubmit={handleLogin}
                            />
                        ) : (
                            <SignupFlow
                                step={signupStep}
                                email={email}
                                password={password}
                                confirmPassword={confirmPassword}
                                username={username}
                                countryCode={countryCode}
                                profileImagePreview={profileImagePreview}
                                countries={countryOptions}
                                loading={submitting}
                                error={error}
                                onEmailChange={setEmail}
                                onPasswordChange={setPassword}
                                onConfirmPasswordChange={setConfirmPassword}
                                onUsernameChange={setUsername}
                                onCountryChange={setCountryCode}
                                onProfileImageChange={handleProfileImageChange}
                                onNextAccount={() => validateAccountStep() && setSignupStep(2)}
                                onNextProfile={() => validateProfileStep() && setSignupStep(3)}
                                onBackProfile={() => setSignupStep(1)}
                                onBackSummary={() => setSignupStep(2)}
                                onSubmit={handleRegister}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </AuthShell>
            <AnimatePresence>
                {welcome && (
                    <AuthWelcomeSplash
                        variant={welcome.variant}
                        username={welcome.username}
                        avatarUrl={welcome.avatarUrl}
                        soundUrl={welcome.soundUrl}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
