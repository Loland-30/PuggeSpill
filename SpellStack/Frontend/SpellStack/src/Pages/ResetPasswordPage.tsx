import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { resetPassword } from "../api/auth"
import FadeIn from "../components/FadeIn"

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token") ?? ""
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleReset = async () => {
        setError("")
        setMessage("")

        if (!token) {
            setError("Reset-token mangler")
            return
        }

        if (password !== confirmPassword) {
            setError("Passordene matcher ikke")
            return
        }

        setSubmitting(true)
        try {
            const result = await resetPassword(token, password)
            setMessage(result)
            setTimeout(() => navigate("/login"), 1200)
        } catch (error) {
            setError(error instanceof Error ? error.message : "Noe gikk galt")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-md place-items-center text-white">
            <FadeIn className="w-full rounded-lg border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
                <p className="text-sm font-bold uppercase tracking-[0.35em] text-orange-300">SpellStack</p>
                <h1 className="mt-3 text-3xl font-black">Reset password</h1>

                <div className="mt-6 space-y-4">
                    <input
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        placeholder="New password"
                        type="password"
                        className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-400"
                    />
                    <input
                        value={confirmPassword}
                        onChange={event => setConfirmPassword(event.target.value)}
                        placeholder="Confirm password"
                        type="password"
                        className="w-full rounded-lg border border-white/10 bg-white px-4 py-3 text-gray-900 outline-none focus:border-orange-400"
                    />
                </div>

                {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
                {message && <p className="mt-4 text-sm text-green-300">{message}</p>}

                <button
                    onClick={handleReset}
                    disabled={submitting || !password || !confirmPassword}
                    className="mt-6 w-full rounded-full bg-orange-400 py-3 font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
                >
                    {submitting ? "Updating..." : "Update password"}
                </button>
            </FadeIn>
        </div>
    )
}
