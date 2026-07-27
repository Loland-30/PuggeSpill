using SpellStack.Api.Services;
using Xunit;

namespace Backend.Tests.Services;

public class ActiveGameRunStoreTests {
    [Fact]
    public async Task Run_IsPopulatedOnceAndKeepsLightweightWordSnapshots() {
        var store = new ActiveGameRunStore();
        var words = CreateWords();
        var run = store.CreateRun(17, 4, 9, words, words[0].Id);

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                lockedRun.Set(run);
                return Task.FromResult(true);
            });

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                Assert.Same(run, lockedRun.Run);
                Assert.Equal(2, lockedRun.Run!.WordCount);
                Assert.Equal("öl", lockedRun.Run.CurrentWord.Translation);
                return Task.FromResult(true);
            });

        Assert.Equal(1, store.ActiveRunCount);
    }

    [Fact]
    public async Task MissingRun_CanBeRebuiltFromPersistedSessionState() {
        var store = new ActiveGameRunStore();
        var words = CreateWords();

        await WithSessionLockAsync(
            store,
            23,
            lockedRun => {
                Assert.Null(lockedRun.Run);
                lockedRun.Set(store.CreateRun(23, 7, 12, words, words[1].Id));
                return Task.FromResult(true);
            });

        await WithSessionLockAsync(
            store,
            23,
            lockedRun => {
                Assert.Equal(words[1].Id, lockedRun.Run!.CurrentWordId);
                return Task.FromResult(true);
            });
    }

    [Fact]
    public async Task SelectNext_DoesNotRepeatCurrentWordWhenAlternativesExist() {
        var store = new ActiveGameRunStore();
        var words = CreateWords();
        var run = store.CreateRun(31, 8, 13, words, words[0].Id);

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                lockedRun.Set(run);
                var previousWordId = run.CurrentWordId;

                for (var index = 0; index < 20; index++) {
                    var nextWord = run.SelectNext(DateTime.UtcNow);
                    Assert.NotEqual(previousWordId, nextWord.Id);
                    previousWordId = nextWord.Id;
                }

                return Task.FromResult(true);
            });
    }

    [Fact]
    public async Task Clear_RemovesCompletedRunState() {
        var store = new ActiveGameRunStore();
        var words = CreateWords();
        var run = store.CreateRun(41, 9, 14, words, words[0].Id);

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                lockedRun.Set(run);
                lockedRun.Clear();
                return Task.FromResult(true);
            });

        Assert.Equal(0, store.ActiveRunCount);
    }

    [Fact]
    public async Task SessionLock_SerializesConcurrentSubmissions() {
        var store = new ActiveGameRunStore();
        var words = CreateWords();
        var run = store.CreateRun(51, 10, 15, words, words[0].Id);
        var concurrent = 0;
        var maxConcurrent = 0;

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                lockedRun.Set(run);
                return Task.FromResult(true);
            });

        var submissions = Enumerable.Range(0, 8).Select(_ =>
            WithSessionLockAsync(
                store,
                run.SessionId,
                async lockedRun => {
                    var current = Interlocked.Increment(ref concurrent);
                    UpdateMaximum(ref maxConcurrent, current);
                    await Task.Delay(15, TestContext.Current.CancellationToken);
                    lockedRun.Run!.SelectNext(DateTime.UtcNow);
                    Interlocked.Decrement(ref concurrent);
                    return true;
                }));

        await Task.WhenAll(submissions);

        Assert.Equal(1, maxConcurrent);
    }

    [Fact]
    public async Task CleanupExpired_RemovesOrphanedRuns() {
        var timeProvider = new AdjustableTimeProvider(
            new DateTimeOffset(2026, 7, 28, 12, 0, 0, TimeSpan.Zero));
        var store = new ActiveGameRunStore(timeProvider, TimeSpan.FromMinutes(30));
        var words = CreateWords();
        var run = store.CreateRun(61, 11, 16, words, words[0].Id);

        await WithSessionLockAsync(
            store,
            run.SessionId,
            lockedRun => {
                lockedRun.Set(run);
                return Task.FromResult(true);
            });

        timeProvider.Advance(TimeSpan.FromMinutes(31));

        Assert.Equal(1, store.CleanupExpired());
        Assert.Equal(0, store.ActiveRunCount);
    }

    private static ActiveGameWordSnapshot[] CreateWords() =>
        [
            new(1, 9, "beer", "öl", null, "ale", null),
            new(2, 9, "spring", "vår", null, null, "A season")
        ];

    private static Task<T> WithSessionLockAsync<T>(
        ActiveGameRunStore store,
        int sessionId,
        Func<ActiveGameRunStore.LockedRun, Task<T>> action) =>
        store.WithSessionLockAsync(
            sessionId,
            action,
            TestContext.Current.CancellationToken);

    private static void UpdateMaximum(ref int target, int value) {
        int current;
        do {
            current = target;
            if (current >= value) return;
        } while (Interlocked.CompareExchange(ref target, value, current) != current);
    }

    private sealed class AdjustableTimeProvider(DateTimeOffset utcNow) : TimeProvider {
        private DateTimeOffset _utcNow = utcNow;

        public override DateTimeOffset GetUtcNow() => _utcNow;

        public void Advance(TimeSpan duration) {
            _utcNow += duration;
        }
    }
}
