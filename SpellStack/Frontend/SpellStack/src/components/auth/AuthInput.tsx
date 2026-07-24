import { forwardRef, useId } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

interface AuthInputProps {
    label: string
    type?: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    icon?: ReactNode
    autoComplete?: string
    hideLabel?: boolean
    labelAction?: ReactNode
    trailing?: ReactNode
    errorId?: string
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
    maxLength?: number
    readOnly?: boolean
    disabled?: boolean
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(function AuthInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    icon,
    autoComplete,
    hideLabel = false,
    labelAction,
    trailing,
    errorId,
    inputMode,
    maxLength,
    readOnly,
    disabled
}, ref) {
    const generatedId = useId()

    return (
        <div className="block">
            {hideLabel ? (
                <label htmlFor={generatedId} className="sr-only">
                    {label}
                </label>
            ) : (
                <span className="mb-2 flex items-center justify-between gap-4">
                    <label
                        htmlFor={generatedId}
                        className="block text-sm font-medium text-white/82"
                    >
                        {label}
                    </label>
                    {labelAction}
                </span>
            )}
            <span className="spellstack-auth-input flex min-h-16 items-center gap-5 rounded-[1.35rem] border border-white bg-[#A7A7A7]/20 px-6 text-white shadow-xl shadow-black/10 backdrop-blur-md">
                {icon && <span className="shrink-0 text-white/90">{icon}</span>}
                <input
                    ref={ref}
                    id={generatedId}
                    type={type}
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    readOnly={readOnly}
                    disabled={disabled}
                    aria-invalid={Boolean(errorId)}
                    aria-describedby={errorId}
                    className="min-w-0 flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-white/70 disabled:cursor-not-allowed"
                />
                {trailing}
            </span>
        </div>
    )
})

export default AuthInput
