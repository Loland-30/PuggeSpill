import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { requestPasswordReset } from "../api/auth"
import { useAuth } from "../auth/AuthContext"
import { useI18n } from "../i18n/I18nContext"
import FadeIn from "../components/FadeIn"
import { languages } from "../data/languages"

export default function AuthPage() {
    const navigate = useNavigate()
    const { loginUser, registerUser } = useAuth()
    const { t } = useI18n()
    const [mode, setMode] = useState<"login" | "register">("login")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [favoriteLanguage, setFavoriteLanguage] = useState("Spansk")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        setError("")
        setMessage("")
        setSubmitting(true)

        try {
            if (mode === "login") {
                await loginUser(email, password)
            } else {
                await registerUser(username, email, password, favoriteLanguage)
            }
            navigate("/profile")
        } catch (error) {
            setError(error instanceof Error ? error.message : "Noe gikk galt")
        } finally {
            setSubmitting(false)
        }
    }

    const handleForgotPassword = async () => {
        setError("")
        setMessage("")

        if (!email) {
            setError("Skriv inn e-posten din først")
            return
        }

        setSubmitting(true)
        try {
            const result = await requestPasswordReset(email)
            setMessage(result)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Noe gikk galt")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 px-6 py-12 text-white">
            <div className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-[102rem] items-center gap-10 md:grid-cols-[1fr_420px]">
                <FadeIn>
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">SpellStack</p>
                    <h1 className="mt-4 text-5xl font-black">Keep your spellwork.</h1>
                    <p className="mt-4 max-w-xl text-lg text-gray-300">
                        Save your decks, track your runs, and build a profile around the languages you practice.
                    </p>
                </div>
                </FadeIn>

                <FadeIn className="rounded-lg border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
                    <div className="mb-6 grid grid-cols-2 rounded-lg bg-black/20 p-1">
                        <button
                            onClick={() => setMode("login")}
                            className={`rounded-md py-2 text-sm font-bold transition ${mode === "login" ? "bg-orange-400 text-white" : "text-gray-300"}`}
                        >
                            {t.auth.login}
                        </button>
                        <button
                            onClick={() => setMode("register")}
                            className={`rounded-md py-2 text-sm font-bold transition ${mode === "register" ? "bg-orange-400 text-white" : "text-gray-300"}`}
                        >
                            {t.auth.register}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {mode === "register" && (
                            <input
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder={t.auth.username}
                                className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-400"
                            />
                        )}
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t.auth.email}
                            type="email"
                            className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-400"
                        />
                        <input
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={t.auth.password}
                            type="password"
                            className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-400"
                        />
                        {mode === "register" && (
                            <select
                                value={favoriteLanguage}
                                onChange={e => setFavoriteLanguage(e.target.value)}
                                className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-orange-400"
                            >
                                {languages.map(language => (
                                    <option key={language.code} value={language.label}>
                                        {language.label}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                    {message && <p className="mt-4 text-sm text-green-300">{message}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !email || !password || (mode === "register" && !username)}
                        className="mt-6 w-full rounded-full bg-orange-400 py-3 font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
                    >
                        {submitting ? t.common.loading : mode === "login" ? t.auth.login : t.auth.createAccount}
                    </button>

                    {mode === "login" && (
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={submitting}
                            className="mt-4 w-full text-sm font-semibold text-orange-200 transition hover:text-orange-100 disabled:opacity-50"
                        >
                            {t.auth.forgotPassword}
                        </button>
                    )}
                </FadeIn>
            </div>
        </div>
    )
}
