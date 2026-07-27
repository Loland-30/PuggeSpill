using System.Collections.Concurrent;
using SpellStack.Api.Models;

namespace SpellStack.Api.Services;

public sealed record ActiveGameWordSnapshot(
    int Id,
    int DeckId,
    string Original,
    string Translation,
    string? AlternativeOriginal,
    string? AlternativeTranslation,
    string? Hint) {

    public static ActiveGameWordSnapshot FromWord(Word word) =>
        new(
            word.Id,
            word.DeckId,
            word.Original,
            word.Translation,
            word.AlternativeOriginal,
            word.AlternativeTranslation,
            word.Hint);

    public Word ToWord() =>
        new() {
            Id = Id,
            DeckId = DeckId,
            Original = Original,
            Translation = Translation,
            AlternativeOriginal = AlternativeOriginal,
            AlternativeTranslation = AlternativeTranslation,
            Hint = Hint
        };
}

public sealed class ActiveGameRun {
    private readonly ActiveGameWordSnapshot[] _words;
    private readonly IReadOnlyDictionary<int, ActiveGameWordSnapshot> _wordsById;

    public ActiveGameRun(
        int sessionId,
        int userId,
        int deckId,
        IEnumerable<ActiveGameWordSnapshot> words,
        int currentWordId,
        DateTime lastActivityUtc) {
        _words = words.ToArray();
        if (_words.Length == 0) {
            throw new ArgumentException("An active game run requires at least one word.", nameof(words));
        }

        _wordsById = _words.ToDictionary(word => word.Id);
        if (!_wordsById.ContainsKey(currentWordId)) {
            throw new ArgumentException("The current word must exist in the active run.", nameof(currentWordId));
        }

        SessionId = sessionId;
        UserId = userId;
        DeckId = deckId;
        CurrentWordId = currentWordId;
        LastActivityUtc = lastActivityUtc;
    }

    public int SessionId { get; }
    public int UserId { get; }
    public int DeckId { get; }
    public int CurrentWordId { get; private set; }
    public DateTime LastActivityUtc { get; private set; }
    public int WordCount => _words.Length;
    public ActiveGameWordSnapshot CurrentWord => _wordsById[CurrentWordId];

    public ActiveGameWordSnapshot SelectNext(DateTime nowUtc) {
        if (_words.Length > 1) {
            ActiveGameWordSnapshot nextWord;
            do {
                nextWord = _words[Random.Shared.Next(_words.Length)];
            } while (nextWord.Id == CurrentWordId);

            CurrentWordId = nextWord.Id;
        }

        LastActivityUtc = nowUtc;
        return CurrentWord;
    }

    public void Touch(DateTime nowUtc) {
        LastActivityUtc = nowUtc;
    }
}

public sealed class ActiveGameRunStore {
    internal sealed class Entry {
        public SemaphoreSlim Gate { get; } = new(1, 1);
        public ActiveGameRun? Run { get; set; }
        public DateTime LastActivityUtc { get; set; }
    }

    public sealed class LockedRun {
        private readonly Entry _entry;
        private readonly TimeProvider _timeProvider;

        internal LockedRun(Entry entry, TimeProvider timeProvider) {
            _entry = entry;
            _timeProvider = timeProvider;
        }

        public ActiveGameRun? Run => _entry.Run;

        public void Set(ActiveGameRun run) {
            _entry.Run = run;
            Touch();
        }

        public void Clear() {
            _entry.Run = null;
            Touch();
        }

        public void Touch() {
            var nowUtc = _timeProvider.GetUtcNow().UtcDateTime;
            _entry.LastActivityUtc = nowUtc;
            _entry.Run?.Touch(nowUtc);
        }
    }

    private readonly ConcurrentDictionary<int, Entry> _entries = new();
    private readonly TimeProvider _timeProvider;
    private readonly TimeSpan _expiration;

    public ActiveGameRunStore()
        : this(TimeProvider.System, TimeSpan.FromHours(2)) {
    }

    public ActiveGameRunStore(TimeProvider timeProvider, TimeSpan expiration) {
        _timeProvider = timeProvider;
        _expiration = expiration;
    }

    public int ActiveRunCount => _entries.Values.Count(entry => entry.Run != null);

    public ActiveGameRun CreateRun(
        int sessionId,
        int userId,
        int deckId,
        IEnumerable<ActiveGameWordSnapshot> words,
        int currentWordId) =>
        new(
            sessionId,
            userId,
            deckId,
            words,
            currentWordId,
            _timeProvider.GetUtcNow().UtcDateTime);

    public async Task<T> WithSessionLockAsync<T>(
        int sessionId,
        Func<LockedRun, Task<T>> action,
        CancellationToken cancellationToken = default) {
        CleanupExpired();

        var nowUtc = _timeProvider.GetUtcNow().UtcDateTime;
        var entry = _entries.GetOrAdd(
            sessionId,
            _ => new Entry { LastActivityUtc = nowUtc });

        await entry.Gate.WaitAsync(cancellationToken);
        try {
            var lockedRun = new LockedRun(entry, _timeProvider);
            lockedRun.Touch();
            return await action(lockedRun);
        }
        finally {
            entry.LastActivityUtc = _timeProvider.GetUtcNow().UtcDateTime;
            entry.Gate.Release();
        }
    }

    public int CleanupExpired() {
        var cutoffUtc = _timeProvider.GetUtcNow().UtcDateTime - _expiration;
        var removed = 0;

        foreach (var pair in _entries) {
            if (pair.Value.LastActivityUtc >= cutoffUtc || pair.Value.Gate.CurrentCount == 0) {
                continue;
            }

            if (_entries.TryRemove(pair)) removed++;
        }

        return removed;
    }
}
