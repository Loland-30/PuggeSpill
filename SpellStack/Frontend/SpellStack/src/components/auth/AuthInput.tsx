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
            <span className="flex min-h-16 items-center gap-5 rounded-[1.35rem] bg-white px-6 text-slate-950 shadow-xl ring-1 ring-white/20 transition focus-within:ring-2 focus-within:ring-white/70">
                {icon && <span className="text-slate-700">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="min-w-0 flex-1 bg-transparent text-lg font-medium text-slate-950 outline-none placeholder:text-slate-500"
                />
            </span>
        </label>
    )
}
