using SpellStack.Api.Multiplayer;
using Xunit;

namespace SpellStack.Api.Tests.Multiplayer;

public class MultiplayerRoomServiceTests {
    private static readonly MultiplayerUser Host = new("host", "Host", null, "NO");
    private static readonly MultiplayerUser Guest = new("guest", "Guest", null, "SE");

    [Fact]
    public void NewRoomUsesRaceDefaultsAndLobbyPhase() {
        var service = new MultiplayerRoomService();

        var room = service.CreateRoom(Host, "host-connection").CurrentRoom!;

        Assert.Equal("race", room.Settings.GameModeId);
        Assert.Equal(10_000, room.Settings.ScoreCap);
        Assert.Equal(1, room.Settings.SettingsVersion);
        Assert.Equal("lobby", room.Phase);
        Assert.Null(room.Race);
    }

    [Fact]
    public void HostCanUpdateScoreCapAndVersionIncrements() {
        var service = CreateRoomWithGuest(out _);

        var room = service.UpdateRoomSettings("host-connection", "race", 50_000);

        Assert.Equal(50_000, room.Settings.ScoreCap);
        Assert.Equal(2, room.Settings.SettingsVersion);
    }

    [Fact]
    public void SharedSettingsChangeInvalidatesEveryReadyPlayer() {
        var service = CreateReadyRoom(out _);

        var room = service.UpdateRoomSettings("host-connection", "race", 50_000);

        Assert.All(room.Players, player => {
            Assert.False(player.IsReady);
            Assert.Null(player.ReadyForSettingsVersion);
        });
    }

    [Fact]
    public void IdenticalSettingsDoNotIncrementVersionOrInvalidateReadyState() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");
        Ready(service, "host-connection", 1);

        var room = service.UpdateRoomSettings("host-connection", "race", 10_000);

        Assert.Equal(1, room.Settings.SettingsVersion);
        Assert.True(room.Players.Single().IsReady);
    }

    [Fact]
    public void ReadyStateStoresValidatedPlayerSetup() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");

        var room = service.SetReady(
            "host-connection",
            42,
            "Spanish verbs",
            12,
            "mixed",
            ["hidden", "extraHeart"],
            1);

        var player = room.Players.Single();
        Assert.True(player.IsReady);
        Assert.Equal(1, player.ReadyForSettingsVersion);
        Assert.Equal(42, player.SelectedDeckId);
        Assert.Equal("Spanish verbs", player.SelectedDeckName);
        Assert.Equal(12, player.DeckWordCount);
        Assert.Equal("mixed", player.Direction);
        Assert.Equal(["hidden", "extraHeart"], player.Modifiers);
    }

    [Fact]
    public void DeckBelowMinimumCannotBecomeReady() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");

        var exception = Assert.Throws<MultiplayerRoomException>(() =>
            service.SetReady("host-connection", 1, "Tiny", 9, "original", [], 1));

        Assert.Contains("at least 10 words", exception.Message);
    }

    [Fact]
    public void ReadyAgainstOldSettingsVersionIsRejected() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");
        service.UpdateRoomSettings("host-connection", "race", 50_000);

        var exception = Assert.Throws<MultiplayerRoomException>(() =>
            Ready(service, "host-connection", 1, settingsVersion: 1));

        Assert.Contains("Room settings changed", exception.Message);
    }

    [Fact]
    public void RaceRequiresTwoConnectedPlayers() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");
        Ready(service, "host-connection", 1);

        var exception = Assert.Throws<MultiplayerRoomException>(() =>
            service.StartRace("host-connection"));

        Assert.Equal("Race needs at least 2 players.", exception.Message);
    }

    [Fact]
    public void OnlyHostCanStartRace() {
        var service = CreateReadyRoom(out _);

        var exception = Assert.Throws<MultiplayerRoomException>(() =>
            service.StartRace("guest-connection"));

        Assert.Equal("Only the host can perform this action.", exception.Message);
    }

    [Fact]
    public void HostCannotStartWhilePlayerIsNotReady() {
        var service = CreateRoomWithGuest(out _);
        Ready(service, "host-connection", 1);

        var exception = Assert.Throws<MultiplayerRoomException>(() =>
            service.StartRace("host-connection"));

        Assert.Equal("Every player must be ready with a valid deck.", exception.Message);
    }

    [Fact]
    public void ValidStartCreatesSynchronizedRaceAndResetsScores() {
        var clock = new ManualTimeProvider();
        var service = CreateReadyRoom(out _, clock);

        var room = service.StartRace("host-connection");

        Assert.Equal("starting", room.Phase);
        Assert.NotNull(room.Race);
        Assert.False(string.IsNullOrWhiteSpace(room.Race.RaceId));
        Assert.Equal(clock.GetUtcNow().UtcDateTime.AddSeconds(3), room.Race.StartsAtUtc);
        Assert.All(room.Players, player => Assert.Equal(0, player.RaceScore));
    }

    [Fact]
    public void ScoreAppliesOnlyToMatchingRaceDeckAndAnswerSequence() {
        var clock = new ManualTimeProvider();
        var service = CreateStartedRace(out var room, clock);
        clock.Advance(TimeSpan.FromSeconds(3));

        var update = service.RecordRaceAnswer("host", room.Race!.RaceId, 1, 1, 500)!;

        Assert.Equal("racing", update.Phase);
        Assert.Equal(500, update.Players.Single(player => player.UserId == "host").RaceScore);

        Assert.Throws<MultiplayerRoomException>(() =>
            service.RecordRaceAnswer("host", room.Race.RaceId, 1, 1, 500));
        Assert.Throws<MultiplayerRoomException>(() =>
            service.RecordRaceAnswer("guest", room.Race.RaceId, 1, 999, 500));
        Assert.Throws<MultiplayerRoomException>(() =>
            service.RecordRaceAnswer("host", "stale-race", 2, 1, 500));
    }

    [Fact]
    public void FirstPlayerAtScoreCapWinsAndFurtherScoresAreRejected() {
        var clock = new ManualTimeProvider();
        var service = CreateStartedRace(out var room, clock);
        clock.Advance(TimeSpan.FromSeconds(3));

        var update = service.RecordRaceAnswer("host", room.Race!.RaceId, 1, 1, 10_000)!;

        Assert.Equal("finished", update.Phase);
        Assert.Equal("host", update.Race.WinnerUserId);
        Assert.True(update.Players.Single(player => player.UserId == "host").IsFinished);
        Assert.Throws<MultiplayerRoomException>(() =>
            service.RecordRaceAnswer("guest", room.Race.RaceId, 1, 2, 10_000));
    }

    [Fact]
    public void EqualScoresRetainDeterministicServerSequence() {
        var clock = new ManualTimeProvider();
        var service = CreateStartedRace(out var room, clock);
        clock.Advance(TimeSpan.FromSeconds(3));

        var first = service.RecordRaceAnswer("guest", room.Race!.RaceId, 1, 2, 500)!;
        var second = service.RecordRaceAnswer("host", room.Race.RaceId, 1, 1, 500)!;

        Assert.True(
            second.Players.Single(player => player.UserId == "guest").ScoreSequence <
            second.Players.Single(player => player.UserId == "host").ScoreSequence);
        Assert.NotNull(first);
    }

    [Fact]
    public void HostMigrationDoesNotInterruptActiveRace() {
        var clock = new ManualTimeProvider();
        var service = CreateStartedRace(out var room, clock);

        var change = service.LeaveRoom("host-connection")!;

        Assert.Equal("guest", change.PreviousRoom!.OwnerUserId);
        Assert.Equal("starting", change.PreviousRoom.Phase);
        Assert.Equal(room.Race!.RaceId, change.PreviousRoom.Race!.RaceId);
    }

    [Fact]
    public void ReconnectRestoresCurrentRaceState() {
        var clock = new ManualTimeProvider();
        var service = CreateStartedRace(out var room, clock);
        service.MarkDisconnected("guest-connection");

        var rejoined = service.JoinRoom(room.Code, Guest, "guest-reconnected").CurrentRoom!;

        Assert.Equal("starting", rejoined.Phase);
        Assert.Equal(room.Race!.RaceId, rejoined.Race!.RaceId);
        Assert.True(rejoined.Players.Single(player => player.UserId == "guest").IsConnected);
        Assert.True(rejoined.Players.Single(player => player.UserId == "guest").IsReady);
    }

    [Fact]
    public void NonHostCannotUpdateSettings() {
        var service = CreateRoomWithGuest(out _);

        var exception = Assert.Throws<MultiplayerRoomException>(
            () => service.UpdateRoomSettings("guest-connection", "race", 50_000));

        Assert.Equal("Only the host can perform this action.", exception.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("battle")]
    [InlineData("unknown")]
    public void UnsupportedModeIsRejected(string gameModeId) {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");

        var exception = Assert.Throws<MultiplayerRoomException>(
            () => service.UpdateRoomSettings("host-connection", gameModeId, 10_000));

        Assert.Equal("Unsupported multiplayer game mode.", exception.Message);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(25_000)]
    [InlineData(999_999_999)]
    public void InvalidScoreCapIsRejected(int scoreCap) {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");

        var exception = Assert.Throws<MultiplayerRoomException>(
            () => service.UpdateRoomSettings("host-connection", "race", scoreCap));

        Assert.Equal("Invalid Race score cap.", exception.Message);
    }

    [Fact]
    public void SettingsSurviveHostMigrationAndNewHostCanUpdate() {
        var service = CreateRoomWithGuest(out var roomCode);
        service.UpdateRoomSettings("host-connection", "race", 50_000);

        var leaveChange = service.LeaveRoom("host-connection")!;
        var migratedRoom = leaveChange.PreviousRoom!;

        Assert.Equal(roomCode, migratedRoom.Code);
        Assert.Equal(Guest.UserId, migratedRoom.OwnerUserId);
        Assert.Equal(50_000, migratedRoom.Settings.ScoreCap);

        var updatedRoom = service.UpdateRoomSettings("guest-connection", "race", 100_000);
        Assert.Equal(100_000, updatedRoom.Settings.ScoreCap);
    }

    private static MultiplayerRoomService CreateRoomWithGuest(
        out string roomCode,
        TimeProvider? clock = null) {
        var service = clock == null ? new MultiplayerRoomService() : new MultiplayerRoomService(clock);
        var room = service.CreateRoom(Host, "host-connection").CurrentRoom!;
        roomCode = room.Code;
        service.JoinRoom(room.Code, Guest, "guest-connection");
        return service;
    }

    private static MultiplayerRoomService CreateReadyRoom(
        out string roomCode,
        TimeProvider? clock = null) {
        var service = CreateRoomWithGuest(out roomCode, clock);
        Ready(service, "host-connection", 1);
        Ready(service, "guest-connection", 2);
        return service;
    }

    private static MultiplayerRoomService CreateStartedRace(
        out MultiplayerRoomDto room,
        ManualTimeProvider clock) {
        var service = CreateReadyRoom(out _, clock);
        room = service.StartRace("host-connection");
        return service;
    }

    private static MultiplayerRoomDto Ready(
        MultiplayerRoomService service,
        string connectionId,
        int deckId,
        int settingsVersion = 1) {
        return service.SetReady(
            connectionId,
            deckId,
            $"Deck {deckId}",
            10,
            "original",
            [],
            settingsVersion);
    }

    private sealed class ManualTimeProvider : TimeProvider {
        private DateTimeOffset utcNow = new(2026, 7, 25, 12, 0, 0, TimeSpan.Zero);

        public override DateTimeOffset GetUtcNow() => utcNow;

        public void Advance(TimeSpan duration) {
            utcNow = utcNow.Add(duration);
        }
    }
}
