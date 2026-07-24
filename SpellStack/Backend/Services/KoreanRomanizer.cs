using System.Collections.Concurrent;
using System.Text;

namespace SpellStack.Api.Services;

public interface IKoreanRomanizer {
    string? TryRomanize(string? text);
}

public sealed class KoreanRomanizer : IKoreanRomanizer {
    private const int HangulBase = 0xAC00;
    private const int HangulEnd = 0xD7A3;
    private const int VowelCount = 21;
    private const int FinalCount = 28;

    private static readonly string[] Initials = [
        "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s",
        "ss", "", "j", "jj", "ch", "k", "t", "p", "h"
    ];

    private static readonly string[] Vowels = [
        "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa",
        "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"
    ];

    private static readonly string[] Finals = [
        "", "k", "k", "k", "n", "n", "n", "t", "l", "k",
        "m", "l", "l", "l", "p", "l", "m", "p", "p", "t",
        "t", "ng", "t", "t", "k", "t", "p", "t"
    ];

    private readonly ConcurrentDictionary<string, string> cache =
        new(StringComparer.Ordinal);

    public string? TryRomanize(string? text) {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var normalized = text.Trim().Normalize(NormalizationForm.FormC);
        if (!normalized.Any(IsHangulSyllable)) return null;

        return cache.GetOrAdd(normalized, Romanize);
    }

    private static string Romanize(string text) {
        var result = new StringBuilder(text.Length * 2);
        var initialOverrides = new Dictionary<int, string>();

        for (var index = 0; index < text.Length; index++) {
            var current = text[index];
            if (!TryDecompose(current, out var syllable)) {
                result.Append(current);
                continue;
            }

            result.Append(
                initialOverrides.TryGetValue(index, out var initialOverride)
                    ? initialOverride
                    : Initials[syllable.Initial]);
            result.Append(Vowels[syllable.Vowel]);
            result.Append(GetFinalRomanization(
                syllable,
                text,
                index,
                initialOverrides));
        }

        return result.ToString();
    }

    private static string GetFinalRomanization(
        HangulSyllable current,
        string text,
        int index,
        IDictionary<int, string> initialOverrides) {
        if (current.Final == 0 ||
            index + 1 >= text.Length ||
            !TryDecompose(text[index + 1], out var next)) {
            return Finals[current.Final];
        }

        if (next.Initial == 11) {
            if (next.Vowel == 20 && current.Final is 7 or 25) {
                initialOverrides[index + 1] = current.Final == 7 ? "j" : "ch";
                return "";
            }

            var liaison = SplitFinalBeforeVowel(current.Final);
            if (liaison.NextInitial != null) {
                initialOverrides[index + 1] = liaison.NextInitial;
            }
            return liaison.CurrentFinal;
        }

        if (next.Initial is 2 or 6) {
            if (IsVelarFinal(current.Final)) return "ng";
            if (IsAlveolarFinal(current.Final)) return "n";
            if (IsLabialFinal(current.Final)) return "m";
        }

        if (next.Initial == 5 && IsNFinal(current.Final)) {
            initialOverrides[index + 1] = "l";
            return "l";
        }

        if (next.Initial is 2 or 5 && IsLFinal(current.Final)) {
            initialOverrides[index + 1] = "l";
            return "l";
        }

        return Finals[current.Final];
    }

    private static (string CurrentFinal, string? NextInitial) SplitFinalBeforeVowel(
        int final) =>
        final switch {
            1 => ("", "g"),
            2 => ("", "kk"),
            3 => ("k", "s"),
            4 => ("", "n"),
            5 => ("n", "j"),
            6 => ("n", ""),
            7 => ("", "d"),
            8 => ("", "r"),
            9 => ("l", "g"),
            10 => ("l", "m"),
            11 => ("l", "b"),
            12 => ("l", "s"),
            13 => ("l", "t"),
            14 => ("l", "p"),
            15 => ("l", ""),
            16 => ("", "m"),
            17 => ("", "b"),
            18 => ("p", "s"),
            19 => ("", "s"),
            20 => ("", "ss"),
            21 => ("ng", null),
            22 => ("", "j"),
            23 => ("", "ch"),
            24 => ("", "k"),
            25 => ("", "t"),
            26 => ("", "p"),
            27 => ("", ""),
            _ => (Finals[final], null)
        };

    private static bool IsVelarFinal(int final) => final is 1 or 2 or 3 or 9 or 24;

    private static bool IsAlveolarFinal(int final) =>
        final is 7 or 19 or 20 or 22 or 23 or 25 or 27;

    private static bool IsLabialFinal(int final) => final is 17 or 18 or 26;

    private static bool IsNFinal(int final) => final is 4 or 5 or 6;

    private static bool IsLFinal(int final) => final is >= 8 and <= 15;

    private static bool IsHangulSyllable(char value) =>
        value is >= (char)HangulBase and <= (char)HangulEnd;

    private static bool TryDecompose(char value, out HangulSyllable syllable) {
        if (!IsHangulSyllable(value)) {
            syllable = default;
            return false;
        }

        var offset = value - HangulBase;
        syllable = new HangulSyllable(
            offset / (VowelCount * FinalCount),
            offset % (VowelCount * FinalCount) / FinalCount,
            offset % FinalCount);
        return true;
    }

    private readonly record struct HangulSyllable(int Initial, int Vowel, int Final);
}
