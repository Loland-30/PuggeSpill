import type { ReactNode } from "react"

interface AuthInputProps {
    label: string
    type?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    icon?: ReactNode
    autoComplete?: string
}

export default function AuthInput({ label, type = "text", value, onChange, placeholder, icon, autoComplete }: AuthInputProps) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-black text-white/86">{label}</span>
            <span className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-slate-950 shadow-xl ring-1 ring-white/20 transition focus-within:ring-2 focus-within:ring-white/70">
                {icon && <span className="text-slate-500">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    className="min-w-0 flex-1 bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
                />
            </span>
        </label>
    )
}
