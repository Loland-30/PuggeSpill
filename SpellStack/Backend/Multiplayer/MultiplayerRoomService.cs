using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace SpellStack.Api.Multiplayer {
    public record MultiplayerUser(string UserId, string Username, string? ProfileImageUrl, string? CountryCode);

    public record MultiplayerPlayerDto(
        string UserId,
        string Username,
        string? ProfileImageUrl,
        string? CountryCode,
        bool IsOwner);

    public record MultiplayerRoomSettingsDto(
        string GameModeId,
        int ScoreCap,
        int SettingsVersion);

    public record MultiplayerRoomDto(
        string Code,
        string OwnerUserId,
        int MaxPlayers,
        IReadOnlyList<MultiplayerPlayerDto> Players,
        MultiplayerRoomSettingsDto Settings);

    public record MultiplayerRoomChange(
        MultiplayerRoomDto? CurrentRoom,
        string? CurrentRoomCode,
        MultiplayerRoomDto? PreviousRoom,
        string? PreviousRoomCode);

    public sealed class MultiplayerRoomException : Exception {
        public MultiplayerRoomException(string message) : base(message) {
        }
    }

    public sealed class MultiplayerRoomService {
        private const int MaxPlayers = 4;
        private const string RaceGameModeId = "race";
        private const int DefaultRaceScoreCap = 10_000;
        private const string CodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        private static readonly HashSet<int> AllowedRaceScoreCaps = [10_000, 50_000, 100_000, 200_000];
        private static readonly Regex RoomCodePattern = new("^[A-Z2-9]{2}@[A-Z2-9]{3}$", RegexOptions.Compiled);
        private readonly object syncRoot = new();
        private readonly Dictionary<string, RoomState> rooms = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> connectionRooms = new(StringComparer.Ordinal);

        public MultiplayerRoomChange CreateRoom(MultiplayerUser user, string connectionId) {
            lock (syncRoot) {
                var previous = RemoveUserFromExistingRoomLocked(user.UserId, connectionId, exceptRoomCode: null);
                var code = GenerateUniqueRoomCodeLocked();
                var room = new RoomState(code, user.UserId);
                room.Players[user.UserId] = PlayerState.From(user, connectionId);
                rooms[code] = room;
                connectionRooms[connectionId] = code;

                return new MultiplayerRoomChange(ToDto(room), code, previous.Room, previous.RoomCode);
            }
        }

        public MultiplayerRoomChange JoinRoom(string roomCode, MultiplayerUser user, string connectionId) {
            var normalizedCode = NormalizeRoomCode(roomCode);

            lock (syncRoot) {
                if (!rooms.TryGetValue(normalizedCode, out var room)) {
                    throw new MultiplayerRoomException("Room not found.");
                }

                var isExistingPlayer = room.Players.ContainsKey(user.UserId);
                if (!isExistingPlayer && room.Players.Count >= MaxPlayers) {
                    throw new MultiplayerRoomException("Room is full.");
                }

                var previous = RemoveUserFromExistingRoomLocked(user.UserId, connectionId, normalizedCode);

                if (room.Players.TryGetValue(user.UserId, out var existingPlayer)) {
                    if (!string.IsNullOrWhiteSpace(existingPlayer.ConnectionId)) {
                        connectionRooms.Remove(existingPlayer.ConnectionId);
                    }

                    existingPlayer.Username = user.Username;
                    existingPlayer.ProfileImageUrl = user.ProfileImageUrl;
                    existingPlayer.CountryCode = user.CountryCode;
                    existingPlayer.ConnectionId = connectionId;
                }
                else {
                    room.Players[user.UserId] = PlayerState.From(user, connectionId);
                }

                connectionRooms[connectionId] = room.Code;
                return new MultiplayerRoomChange(ToDto(room), room.Code, previous.Room, previous.RoomCode);
            }
        }

        public MultiplayerRoomChange? LeaveRoom(string connectionId) {
            lock (syncRoot) {
                return RemoveConnectionFromRoomLocked(connectionId);
            }
        }

        public MultiplayerRoomChange? CompleteDisconnect(string connectionId) {
            lock (syncRoot) {
                return RemoveConnectionFromRoomLocked(connectionId);
            }
        }

        public MultiplayerRoomDto UpdateRoomSettings(string connectionId, string gameModeId, int scoreCap) {
            lock (syncRoot) {
                if (!connectionRooms.TryGetValue(connectionId, out var roomCode)) {
                    throw new MultiplayerRoomException("You must be in a multiplayer room.");
                }

                if (!rooms.TryGetValue(roomCode, out var room)) {
                    connectionRooms.Remove(connectionId);
                    throw new MultiplayerRoomException("The room no longer exists.");
                }

                var caller = room.Players.Values.FirstOrDefault(player => player.ConnectionId == connectionId);
                if (caller == null) {
                    connectionRooms.Remove(connectionId);
                    throw new MultiplayerRoomException("You must be in a multiplayer room.");
                }

                if (!string.Equals(caller.UserId, room.OwnerUserId, StringComparison.Ordinal)) {
                    throw new MultiplayerRoomException("Only the host can change the game settings.");
                }

                var normalizedGameModeId = (gameModeId ?? "").Trim().ToLowerInvariant();
                if (!string.Equals(normalizedGameModeId, RaceGameModeId, StringComparison.Ordinal)) {
                    throw new MultiplayerRoomException("Unsupported multiplayer game mode.");
                }

                if (!AllowedRaceScoreCaps.Contains(scoreCap)) {
                    throw new MultiplayerRoomException("Invalid Race score cap.");
                }

                if (room.Settings.GameModeId == normalizedGameModeId && room.Settings.ScoreCap == scoreCap) {
                    return ToDto(room);
                }

                room.Settings.GameModeId = normalizedGameModeId;
                room.Settings.ScoreCap = scoreCap;
                // Later ready-state synchronization can invalidate readiness when this version changes.
                room.Settings.SettingsVersion++;
                return ToDto(room);
            }
        }

        private MultiplayerRoomChange? RemoveConnectionFromRoomLocked(string connectionId) {
            if (!connectionRooms.TryGetValue(connectionId, out var roomCode)) {
                return null;
            }

            if (!rooms.TryGetValue(roomCode, out var room)) {
                connectionRooms.Remove(connectionId);
                return null;
            }

            var player = room.Players.Values.FirstOrDefault(roomPlayer => roomPlayer.ConnectionId == connectionId);
            if (player == null) {
                connectionRooms.Remove(connectionId);
                return null;
            }

            connectionRooms.Remove(connectionId);
            room.Players.Remove(player.UserId);
            var updatedRoom = NormalizeRoomAfterPlayerRemovalLocked(room);
            return new MultiplayerRoomChange(null, null, updatedRoom, room.Code);
        }

        private (MultiplayerRoomDto? Room, string? RoomCode) RemoveUserFromExistingRoomLocked(string userId, string connectionId, string? exceptRoomCode) {
            connectionRooms.Remove(connectionId);

            foreach (var room in rooms.Values.ToList()) {
                if (exceptRoomCode != null && string.Equals(room.Code, exceptRoomCode, StringComparison.OrdinalIgnoreCase)) {
                    continue;
                }

                if (!room.Players.TryGetValue(userId, out var player)) {
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(player.ConnectionId)) {
                    connectionRooms.Remove(player.ConnectionId);
                }

                room.Players.Remove(userId);
                var updatedRoom = NormalizeRoomAfterPlayerRemovalLocked(room);
                return (updatedRoom, room.Code);
            }

            return (null, null);
        }

        private MultiplayerRoomDto? NormalizeRoomAfterPlayerRemovalLocked(RoomState room) {
            if (room.Players.Count == 0) {
                rooms.Remove(room.Code);
                return null;
            }

            if (!room.Players.ContainsKey(room.OwnerUserId)) {
                room.OwnerUserId = room.Players.Values
                    .OrderBy(player => player.JoinedAt)
                    .First()
                    .UserId;
            }

            return ToDto(room);
        }

        private string GenerateUniqueRoomCodeLocked() {
            for (var attempt = 0; attempt < 128; attempt++) {
                var code = $"{RandomChunk(2)}@{RandomChunk(3)}";
                if (!rooms.ContainsKey(code)) return code;
            }

            throw new MultiplayerRoomException("Could not create a unique room code. Please try again.");
        }

        private static string RandomChunk(int length) {
            return new string(Enumerable.Range(0, length)
                .Select(_ => CodeCharacters[RandomNumberGenerator.GetInt32(CodeCharacters.Length)])
                .ToArray());
        }

        private static string NormalizeRoomCode(string roomCode) {
            var normalized = roomCode.Trim().ToUpperInvariant();
            if (!RoomCodePattern.IsMatch(normalized) || normalized.Any(character => character != '@' && !CodeCharacters.Contains(character))) {
                throw new MultiplayerRoomException("Invalid room code.");
            }

            return normalized;
        }

        private static MultiplayerRoomDto ToDto(RoomState room) {
            var players = room.Players.Values
                .OrderBy(player => player.JoinedAt)
                .Select(player => new MultiplayerPlayerDto(
                    player.UserId,
                    player.Username,
                    player.ProfileImageUrl,
                    player.CountryCode,
                    player.UserId == room.OwnerUserId))
                .ToList();

            return new MultiplayerRoomDto(
                room.Code,
                room.OwnerUserId,
                MaxPlayers,
                players,
                new MultiplayerRoomSettingsDto(
                    room.Settings.GameModeId,
                    room.Settings.ScoreCap,
                    room.Settings.SettingsVersion));
        }

        private sealed class RoomState {
            public RoomState(string code, string ownerUserId) {
                Code = code;
                OwnerUserId = ownerUserId;
                Settings = new RoomSettingsState {
                    GameModeId = RaceGameModeId,
                    ScoreCap = DefaultRaceScoreCap,
                    SettingsVersion = 1
                };
            }

            public string Code { get; }
            public string OwnerUserId { get; set; }
            public Dictionary<string, PlayerState> Players { get; } = new(StringComparer.Ordinal);
            public RoomSettingsState Settings { get; }
        }

        private sealed class RoomSettingsState {
            public string GameModeId { get; set; } = RaceGameModeId;
            public int ScoreCap { get; set; } = DefaultRaceScoreCap;
            public int SettingsVersion { get; set; } = 1;
        }

        private sealed class PlayerState {
            public string UserId { get; init; } = "";
            public string Username { get; set; } = "";
            public string? ProfileImageUrl { get; set; }
            public string? CountryCode { get; set; }
            public string ConnectionId { get; set; } = "";
            public DateTime JoinedAt { get; init; }

            public static PlayerState From(MultiplayerUser user, string connectionId) {
                return new PlayerState {
                    UserId = user.UserId,
                    Username = user.Username,
                    ProfileImageUrl = user.ProfileImageUrl,
                    CountryCode = user.CountryCode,
                    ConnectionId = connectionId,
                    JoinedAt = DateTime.UtcNow
                };
            }
        }
    }
}
