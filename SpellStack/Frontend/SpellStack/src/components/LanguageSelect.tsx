import { languages } from "../data/languages"

interface Props {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    inputClassName?: string
    panelClassName?: string
}

export default function LanguageSelect({ value, onChange, placeholder = "Select language", inputClassName = "text-gray-900", panelClassName = "bg-white" }: Props) {

    const selected = languages.find(l => l.code === value)

    return (
        <div className="relative">
            <div className={`flex items-center gap-2 border border-white/20 rounded-xl px-4 py-3 cursor-pointer ${panelClassName}`}>
                {selected && (
                    <img src={selected.flagUrl} className="w-6 h-4 rounded-sm object-cover" />
                )}
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full outline-none text-sm bg-transparent cursor-pointer ${inputClassName}`}
                >
                    <option value="">{placeholder}</option>
                    {languages.map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}
