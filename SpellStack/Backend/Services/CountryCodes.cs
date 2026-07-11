namespace SpellStack.Api.Services {
    public static class CountryCodes {
        private static readonly HashSet<string> Supported = new(StringComparer.Ordinal) {
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
        };

        public static bool TryNormalize(string? value, out string? countryCode) {
            countryCode = value?.Trim().ToUpperInvariant();
            if (countryCode != null && Supported.Contains(countryCode)) return true;

            countryCode = null;
            return false;
        }
    }
}
