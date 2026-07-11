import { useEffect, useRef, useState } from "react"
import { ChevronDown, Search } from "lucide-react"

import type { AuthCountryOption } from "./SignupStepProfile"

interface AuthCountrySelectProps {
    value: string
    countries: AuthCountryOption[]
    onChange: (value: string) => void
}

export default function AuthCountrySelect({ value, countries, onChange }: AuthCountrySelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const menuRef = useRef<HTMLDivElement>(null)
    const selectedCountry = countries.find(country => country.code === value) ?? countries[0]
    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        country.code.toLowerCase().includes(search.trim().toLowerCase())
    )

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    return (
        <div ref={menuRef} className="relative z-30">
            <button
                type="button"
                onClick={() => setOpen(current => !current)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className="flex min-h-16 w-full items-center gap-4 rounded-[1.35rem] border border-white bg-[#A7A7A7]/20 px-5 text-left text-white shadow-xl shadow-black/10 backdrop-blur-md focus:outline-none"
            >
                <span className="text-3xl leading-none">{selectedCountry.flag}</span>
                <span className="min-w-0 flex-1 truncate text-lg font-medium">{selectedCountry.name}</span>
                <ChevronDown size={18} strokeWidth={2.4} className={`shrink-0 transition duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-[1000] mt-3 max-h-72 overflow-y-auto rounded-[1.35rem] border border-white/12 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                    <label className="mb-2 flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-3 py-2 text-white/70">
                        <Search size={17} aria-hidden="true" />
                        <span className="sr-only">Search countries</span>
                        <input
                            value={search}
                            onChange={event => setSearch(event.target.value)}
                            placeholder="Search countries"
                            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
                        />
                    </label>
                    {filteredCountries.map(country => {
                        const selected = country.code === value

                        return (
                            <button
                                key={country.code}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                    onChange(country.code)
                                    setOpen(false)
                                }}
                                className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left text-base font-semibold transition ${selected ? "bg-white text-slate-950" : "text-white hover:bg-white/10"}`}
                            >
                                <span className="text-2xl leading-none">{country.flag}</span>
                                <span>{country.name}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
