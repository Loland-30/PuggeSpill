export interface Country {
    code: string
    flagUrl: string
}

const countryCodes = [
    "NO", "SE", "DK", "FI", "IS", "GB", "IE", "US", "CA", "AU", "NZ",
    "ES", "PT", "FR", "DE", "IT", "NL", "BE", "CH", "AT", "PL", "CZ",
    "SK", "HU", "RO", "BG", "GR", "HR", "SI", "RS", "BA", "EE", "LV",
    "LT", "UA", "TR", "JP", "KR", "CN", "TW", "HK", "IN", "PK", "BD",
    "LK", "NP", "TH", "VN", "ID", "MY", "SG", "PH", "MX", "BR", "AR",
    "CL", "CO", "PE", "VE", "EC", "UY", "PY", "BO", "ZA", "EG", "MA",
    "DZ", "TN", "NG", "KE", "GH", "ET", "TZ", "IL", "SA", "AE", "QA",
    "IR", "LU", "MT", "CY", "AL", "MK", "ME", "MD", "BY", "GE", "AM",
    "AZ", "KZ", "UZ", "KG", "TJ", "MN", "AF", "IQ", "SY", "JO", "LB",
    "OM", "KW", "BH", "YE", "KH", "LA", "MM", "BN", "CR", "PA", "GT",
    "HN", "SV", "NI", "CU", "DO", "HT", "JM", "TT", "BS", "UG", "RW",
    "BI", "CD", "CM", "SN", "CI", "AO", "MZ", "NA", "BW", "ZW", "ZM",
    "MW", "SD", "LY", "FJ", "PG"
] as const

export const countries: Country[] = countryCodes.map(code => ({
    code,
    flagUrl: `https://flagcdn.com/w40/${code.toLowerCase()}.png`
}))

export function normalizeCountryCode(value: string | null | undefined) {
    const normalized = value?.trim().toUpperCase()
    return countries.some(country => country.code === normalized) ? normalized! : "NO"
}

export function getCountryName(code: string, locale = "en") {
    try {
        return new Intl.DisplayNames([locale], { type: "region" }).of(normalizeCountryCode(code)) ?? code
    } catch {
        return normalizeCountryCode(code)
    }
}

export function getCountryFlag(code: string) {
    return normalizeCountryCode(code)
        .split("")
        .map(character => String.fromCodePoint(127397 + character.charCodeAt(0)))
        .join("")
}
