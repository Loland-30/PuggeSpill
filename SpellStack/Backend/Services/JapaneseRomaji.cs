using System.Text;

namespace SpellStack.Api.Services;

internal static class JapaneseRomaji {
    private static readonly IReadOnlyDictionary<string, string> Syllables =
        new Dictionary<string, string>(StringComparer.Ordinal) {
            ["きゃ"] = "kya", ["きゅ"] = "kyu", ["きょ"] = "kyo",
            ["しゃ"] = "sha", ["しゅ"] = "shu", ["しょ"] = "sho",
            ["ちゃ"] = "cha", ["ちゅ"] = "chu", ["ちょ"] = "cho",
            ["にゃ"] = "nya", ["にゅ"] = "nyu", ["にょ"] = "nyo",
            ["ひゃ"] = "hya", ["ひゅ"] = "hyu", ["ひょ"] = "hyo",
            ["みゃ"] = "mya", ["みゅ"] = "myu", ["みょ"] = "myo",
            ["りゃ"] = "rya", ["りゅ"] = "ryu", ["りょ"] = "ryo",
            ["ぎゃ"] = "gya", ["ぎゅ"] = "gyu", ["ぎょ"] = "gyo",
            ["じゃ"] = "ja", ["じゅ"] = "ju", ["じょ"] = "jo",
            ["びゃ"] = "bya", ["びゅ"] = "byu", ["びょ"] = "byo",
            ["ぴゃ"] = "pya", ["ぴゅ"] = "pyu", ["ぴょ"] = "pyo",
            ["てぃ"] = "ti", ["でぃ"] = "di", ["ふぁ"] = "fa",
            ["ふぃ"] = "fi", ["ふぇ"] = "fe", ["ふぉ"] = "fo",
            ["あ"] = "a", ["い"] = "i", ["う"] = "u", ["え"] = "e", ["お"] = "o",
            ["か"] = "ka", ["き"] = "ki", ["く"] = "ku", ["け"] = "ke", ["こ"] = "ko",
            ["さ"] = "sa", ["し"] = "shi", ["す"] = "su", ["せ"] = "se", ["そ"] = "so",
            ["た"] = "ta", ["ち"] = "chi", ["つ"] = "tsu", ["て"] = "te", ["と"] = "to",
            ["な"] = "na", ["に"] = "ni", ["ぬ"] = "nu", ["ね"] = "ne", ["の"] = "no",
            ["は"] = "ha", ["ひ"] = "hi", ["ふ"] = "fu", ["へ"] = "he", ["ほ"] = "ho",
            ["ま"] = "ma", ["み"] = "mi", ["む"] = "mu", ["め"] = "me", ["も"] = "mo",
            ["や"] = "ya", ["ゆ"] = "yu", ["よ"] = "yo",
            ["ら"] = "ra", ["り"] = "ri", ["る"] = "ru", ["れ"] = "re", ["ろ"] = "ro",
            ["わ"] = "wa", ["を"] = "o", ["ん"] = "n",
            ["が"] = "ga", ["ぎ"] = "gi", ["ぐ"] = "gu", ["げ"] = "ge", ["ご"] = "go",
            ["ざ"] = "za", ["じ"] = "ji", ["ず"] = "zu", ["ぜ"] = "ze", ["ぞ"] = "zo",
            ["だ"] = "da", ["ぢ"] = "ji", ["づ"] = "zu", ["で"] = "de", ["ど"] = "do",
            ["ば"] = "ba", ["び"] = "bi", ["ぶ"] = "bu", ["べ"] = "be", ["ぼ"] = "bo",
            ["ぱ"] = "pa", ["ぴ"] = "pi", ["ぷ"] = "pu", ["ぺ"] = "pe", ["ぽ"] = "po",
            ["ぁ"] = "a", ["ぃ"] = "i", ["ぅ"] = "u", ["ぇ"] = "e", ["ぉ"] = "o"
        };

    public static string? ToRomaji(string value) {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var kana = ToHiragana(value.Trim().Normalize(NormalizationForm.FormC));
        var result = new StringBuilder();
        var doubleNextConsonant = false;

        for (var index = 0; index < kana.Length; index++) {
            var current = kana[index];
            if (current == 'っ') {
                doubleNextConsonant = true;
                continue;
            }
            if (current == 'ー') {
                var vowel = LastVowel(result);
                if (vowel != null) result.Append(vowel.Value);
                continue;
            }

            var token = index + 1 < kana.Length
                ? kana.Substring(index, 2)
                : "";
            if (!Syllables.TryGetValue(token, out var syllable)) {
                token = current.ToString();
                if (!Syllables.TryGetValue(token, out syllable)) return null;
            } else {
                index++;
            }

            if (doubleNextConsonant) {
                var consonant = syllable.FirstOrDefault(character =>
                    character is not ('a' or 'e' or 'i' or 'o' or 'u'));
                if (consonant != default) result.Append(consonant);
                doubleNextConsonant = false;
            }
            result.Append(syllable);
        }

        return result.Length == 0 ? null : result.ToString();
    }

    private static string ToHiragana(string value) {
        var result = new StringBuilder(value.Length);
        foreach (var character in value) {
            result.Append(character is >= '\u30a1' and <= '\u30f6'
                ? (char)(character - 0x60)
                : character);
        }
        return result.ToString();
    }

    private static char? LastVowel(StringBuilder value) {
        for (var index = value.Length - 1; index >= 0; index--) {
            if (value[index] is 'a' or 'e' or 'i' or 'o' or 'u') return value[index];
        }
        return null;
    }
}
