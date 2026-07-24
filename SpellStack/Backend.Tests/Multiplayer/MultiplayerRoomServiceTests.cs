using SpellStack.Api.Multiplayer;
using Xunit;

namespace SpellStack.Api.Tests.Multiplayer;

public class MultiplayerRoomServiceTests {
    private static readonly MultiplayerUser Host = new("host", "Host", null, "NO");
    private static readonly MultiplayerUser Guest = new("guest", "Guest", null, "SE");

    [Fact]
    public void NewRoomUsesRaceDefaultsAndIncludesSettingsInDto() {
        var service = new MultiplayerRoomService();

        var room = service.CreateRoom(Host, "host-connection").CurrentRoom!;

        Assert.Equal("race", room.Settings.GameModeId);
        Assert.Equal(10_000, room.Settings.ScoreCap);
        Assert.Equal(1, room.Settings.SettingsVersion);
    }

    [Fact]
    public void HostCanUpdateScoreCapAndVersionIncrements() {
        var service = CreateRoomWithGuest(out _);

        var room = service.UpdateRoomSettings("host-connection", "race", 50_000);

        Assert.Equal(50_000, room.Settings.ScoreCap);
        Assert.Equal(2, room.Settings.SettingsVersion);
    }

    [Fact]
    public void IdenticalSettingsDoNotIncrementVersion() {
        var service = new MultiplayerRoomService();
        service.CreateRoom(Host, "host-connection");

        var room = service.UpdateRoomSettings("host-connection", "race", 10_000);

        Assert.Equal(1, room.Settings.SettingsVersion);
    }

    [Fact]
    public void NonHostCannotUpdateSettings() {
        var service = CreateRoomWithGuest(out _);

        var exception = Assert.Throws<MultiplayerRoomException>(
            () => service.UpdateRoomSettings("guest-connection", "race", 50_000));

        Assert.Equal("Only the host can change the game settings.", exception.Message);
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
        Assert.Equal(2, migratedRoom.Settings.SettingsVersion);

        var updatedRoom = service.UpdateRoomSettings("guest-connection", "race", 100_000);
        Assert.Equal(100_000, updatedRoom.Settings.ScoreCap);
        Assert.Equal(3, updatedRoom.Settings.SettingsVersion);
    }

    [Fact]
    public void PreviousHostCannotUpdateAfterLeaving() {
        var service = CreateRoomWithGuest(out _);
        service.LeaveRoom("host-connection");

        var exception = Assert.Throws<MultiplayerRoomException>(
            () => service.UpdateRoomSettings("host-connection", "race", 50_000));

        Assert.Equal("You must be in a multiplayer room.", exception.Message);
    }

    private static MultiplayerRoomService CreateRoomWithGuest(out string roomCode) {
        var service = new MultiplayerRoomService();
        var room = service.CreateRoom(Host, "host-connection").CurrentRoom!;
        roomCode = room.Code;
        service.JoinRoom(room.Code, Guest, "guest-connection");
        return service;
    }
}
