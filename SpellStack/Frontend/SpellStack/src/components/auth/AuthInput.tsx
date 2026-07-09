import type { ReactNode } from "react"

interface AuthInputProps {
    label: string
    type?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    icon?: ReactNode
    autoComplete?: string
    hideLabel?: boolean
}

export default function AuthInput({ label, type = "text", value, onChange, placeholder, icon, autoComplete, hideLabel = false }: AuthInputProps) {
    return (
        <label className="block">
            <span className={`${hideLabel ? "sr-only" : "mb-2 block text-sm font-medium text-white/82"}`}>{label}</span>
            <span className="spellstack-auth-input flex min-h-16 items-center gap-5 rounded-[1.35rem] border border-white bg-[#A7A7A7]/20 px-6 text-white shadow-xl shadow-black/10 backdrop-blur-md">
                {icon && <span className="text-white/90">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/70"
                />
            </span>
        </label>
    )
}
