using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace SpellStack.Api.Multiplayer {
    public record MultiplayerUser(string UserId, string Username, string? ProfileImageUrl, string? CountryCode);

    public record MultiplayerPlayerDto(
        string UserId,
        string Username,
        string? ProfileImageUrl,
        string? CountryCode,
        bool IsOwner,
        bool IsConnected,
        int? SelectedDeckId,
        string? SelectedDeckName,
        int? DeckWordCount,
        string? DeckLanguage,
        string? Direction,
        IReadOnlyList<string> Modifiers,
        bool IsReady,
        int? ReadyForSettingsVersion,
        int RaceScore,
        long ScoreSequence,
        int LastAnswerSequence,
        bool IsFinished,
        DateTime? FinishedAtUtc,
        int? Placement,
        bool IsDnf,
        double FinalAccuracy,
        int BestStreak,
        int Kills,
        int RushHoursTriggered,
        bool HasReturnedToLobby);

    public record MultiplayerRoomSettingsDto(
        string GameModeId,
        int ScoreCap,
        int SettingsVersion);

    public record MultiplayerRaceDto(
        string RaceId,
        int ScoreCap,
        DateTime StartsAtUtc,
        DateTime? StartedAtUtc,
        string? WinnerUserId,
        DateTime? FinishedAtUtc);

    public record MultiplayerRoomDto(
        string Code,
        string OwnerUserId,
        int MaxPlayers,
        string Phase,
        IReadOnlyList<MultiplayerPlayerDto> Players,
        MultiplayerRoomSettingsDto Settings,
        MultiplayerRaceDto? Race);

    public record MultiplayerRaceLeaderboardPlayerDto(
        string UserId,
        int RaceScore,
        long ScoreSequence,
        int LastAnswerSequence,
        bool IsFinished,
        DateTime? FinishedAtUtc,
        int? Placement,
        bool IsDnf,
        double FinalAccuracy,
        int BestStreak,
        int Kills,
        int RushHoursTriggered);

    public record MultiplayerRaceUpdateDto(
        string RoomCode,
        string Phase,
        MultiplayerRaceDto Race,
        IReadOnlyList<MultiplayerRaceLeaderboardPlayerDto> Players);

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
        public const int MinimumRaceDeckWordCount = 10;

        private const int MaxPlayers = 4;
        private const string RaceGameModeId = "race";
        private const int DefaultRaceScoreCap = 10_000;
        private const string LobbyPhase = "lobby";
        private const string StartingPhase = "starting";
        private const string RacingPhase = "racing";
        private const string FinishedPhase = "finished";
        private const string CodeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        private static readonly TimeSpan RaceStartDelay = TimeSpan.FromSeconds(3);
        private static readonly HashSet<int> AllowedRaceScoreCaps = [10_000, 50_000, 100_000, 200_000];
        private static readonly HashSet<string> AllowedDirections = ["original", "translation", "mixed"];
        private static readonly HashSet<string> AllowedModifiers = ["extraHeart", "hardcore", "momentum", "hidden", "noTime"];
        private static readonly Regex RoomCodePattern = new("^[A-Z2-9]{2}@[A-Z2-9]{3}$", RegexOptions.Compiled);
        private readonly object syncRoot = new();
        private readonly Dictionary<string, RoomState> rooms = new(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> connectionRooms = new(StringComparer.Ordinal);
        private readonly TimeProvider timeProvider;

        public MultiplayerRoomService() : this(TimeProvider.System) {
        }

        public MultiplayerRoomService(TimeProvider timeProvider) {
            this.timeProvider = timeProvider;
        }

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
                if (!isExistingPlayer && room.Phase != LobbyPhase) {
                    throw new MultiplayerRoomException("This Race has already started.");
                }

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
                    existingPlayer.IsConnected = true;
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

        public MultiplayerRoomDto? MarkDisconnected(string connectionId) {
            lock (syncRoot) {
                if (!TryGetRoomAndPlayerLocked(connectionId, out var room, out var player)) return null;

                player.IsConnected = false;
                return ToDto(room);
            }
        }

        public MultiplayerRoomChange? CompleteDisconnect(string connectionId) {
            lock (syncRoot) {
                return RemoveConnectionFromRoomLocked(connectionId);
            }
        }

        public MultiplayerRoomDto UpdateRoomSettings(string connectionId, string gameModeId, int scoreCap) {
            lock (syncRoot) {
                var (room, caller) = GetRoomAndPlayerLocked(connectionId);
                EnsureHost(room, caller);

                if (room.Phase != LobbyPhase) {
                    throw new MultiplayerRoomException("Game settings cannot change after the Race starts.");
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
                room.Settings.SettingsVersion++;

                foreach (var player in room.Players.Values) {
                    player.IsReady = false;
                    player.ReadyForSettingsVersion = null;
                }

                return ToDto(room);
            }
        }

        public MultiplayerRoomDto SetReady(
            string connectionId,
            int selectedDeckId,
            string selectedDeckName,
            int deckWordCount,
            string deckLanguage,
            string direction,
            IReadOnlyCollection<string> modifiers,
            int settingsVersion) {
            lock (syncRoot) {
                var (room, player) = GetRoomAndPlayerLocked(connectionId);
                if (room.Phase != LobbyPhase) {
                    throw new MultiplayerRoomException("You cannot change ready state after the Race starts.");
                }

                if (settingsVersion != room.Settings.SettingsVersion) {
                    throw new MultiplayerRoomException("Room settings changed. Review them before readying again.");
                }

                if (selectedDeckId <= 0 || deckWordCount < MinimumRaceDeckWordCount) {
                    throw new MultiplayerRoomException($"Multiplayer decks need at least {MinimumRaceDeckWordCount} words.");
                }

                var normalizedDirection = direction.Trim().ToLowerInvariant();
                if (!AllowedDirections.Contains(normalizedDirection)) {
                    throw new MultiplayerRoomException("Invalid game direction.");
                }

                var normalizedModifiers = NormalizeModifiers(modifiers);
                player.SelectedDeckId = selectedDeckId;
                player.SelectedDeckName = selectedDeckName;
                player.DeckWordCount = deckWordCount;
                player.DeckLanguage = deckLanguage;
                player.Direction = normalizedDirection;
                player.Modifiers = normalizedModifiers;
                player.IsReady = true;
                player.ReadyForSettingsVersion = settingsVersion;

                return ToDto(room);
            }
        }

        public MultiplayerRoomDto SetUnready(string connectionId) {
            lock (syncRoot) {
                var (room, player) = GetRoomAndPlayerLocked(connectionId);
                if (room.Phase != LobbyPhase) {
                    throw new MultiplayerRoomException("You cannot change ready state after the Race starts.");
                }

                player.IsReady = false;
                player.ReadyForSettingsVersion = null;
                return ToDto(room);
            }
        }

        public MultiplayerRoomDto StartRace(string connectionId) {
            lock (syncRoot) {
                var (room, caller) = GetRoomAndPlayerLocked(connectionId);
                EnsureHost(room, caller);

                if (room.Phase != LobbyPhase) {
                    throw new MultiplayerRoomException("The Race has already started.");
                }

                if (!string.Equals(room.Settings.GameModeId, RaceGameModeId, StringComparison.Ordinal)) {
                    throw new MultiplayerRoomException("Race is not the selected game mode.");
                }

                if (!AllowedRaceScoreCaps.Contains(room.Settings.ScoreCap)) {
                    throw new MultiplayerRoomException("Invalid Race score cap.");
                }

                var connectedPlayers = room.Players.Values.Where(player => player.IsConnected).ToList();
                if (connectedPlayers.Count < 2) {
                    throw new MultiplayerRoomException("Race needs at least 2 players.");
                }

                if (connectedPlayers.Any(player =>
                        !player.IsReady ||
                        player.ReadyForSettingsVersion != room.Settings.SettingsVersion ||
                        !player.SelectedDeckId.HasValue ||
                        player.DeckWordCount < MinimumRaceDeckWordCount)) {
                    throw new MultiplayerRoomException("Every player must be ready with a valid deck.");
                }

                var startsAtUtc = UtcNow.Add(RaceStartDelay);
                room.Phase = StartingPhase;
                room.Race = new RaceState {
                    RaceId = Guid.NewGuid().ToString("N"),
                    ScoreCap = room.Settings.ScoreCap,
                    StartsAtUtc = startsAtUtc
                };
                room.NextScoreSequence = 0;

                foreach (var player in room.Players.Values) {
                    player.RaceScore = 0;
                    player.ScoreSequence = 0;
                    player.LastAnswerSequence = 0;
                    player.IsFinished = false;
                    player.FinishedAtUtc = null;
                    player.Placement = null;
                    player.IsDnf = false;
                    player.IsRaceParticipant = player.IsConnected;
                    player.FinalAccuracy = 0;
                    player.BestStreak = 0;
                    player.Kills = 0;
                    player.RushHoursTriggered = 0;
                    player.HasReturnedToLobby = false;
                }

                return ToDto(room);
            }
        }

        public void ValidateRaceAnswer(string userId, string raceId, int answerSequence, int deckId) {
            lock (syncRoot) {
                var (room, player) = GetActiveRacePlayerLocked(userId, raceId);
                EnsureRaceCanAcceptAnswerLocked(room, player, answerSequence, deckId);
            }
        }

        public MultiplayerRaceUpdateDto? RecordRaceAnswer(
            string userId,
            string raceId,
            int answerSequence,
            int deckId,
            int awardedScore,
            int correctAnswers,
            int questionsAnswered,
            int bestStreak,
            int rushHoursTriggered,
            bool enemyDefeated) {
            lock (syncRoot) {
                var (room, player) = GetActiveRacePlayerLocked(userId, raceId);
                EnsureRaceCanAcceptAnswerLocked(room, player, answerSequence, deckId);

                var phaseChanged = room.Phase == StartingPhase;
                if (phaseChanged) {
                    room.Phase = RacingPhase;
                    room.Race!.StartedAtUtc = room.Race.StartsAtUtc;
                }

                player.LastAnswerSequence = answerSequence;
                player.FinalAccuracy = questionsAnswered <= 0
                    ? 0
                    : Math.Round(correctAnswers * 100d / questionsAnswered, 2);
                player.BestStreak = Math.Max(player.BestStreak, bestStreak);
                player.RushHoursTriggered = Math.Max(player.RushHoursTriggered, rushHoursTriggered);
                if (enemyDefeated) player.Kills++;

                if (awardedScore > 0) {
                    player.RaceScore = Math.Min(int.MaxValue, player.RaceScore + awardedScore);
                    player.ScoreSequence = ++room.NextScoreSequence;
                }

                if (player.RaceScore >= room.Race!.ScoreCap && !player.IsFinished) {
                    var finishedAtUtc = UtcNow;
                    player.IsFinished = true;
                    player.FinishedAtUtc = finishedAtUtc;
                    player.Placement = ++room.Race.FinishCount;
                    room.Race.WinnerUserId ??= player.UserId;
                }

                FinalizeRaceIfCompleteLocked(room);
                return ToRaceUpdateDto(room);
            }
        }

        public MultiplayerRoomDto ReturnToLobby(string connectionId) {
            lock (syncRoot) {
                var (room, player) = GetRoomAndPlayerLocked(connectionId);
                if (room.Phase != FinishedPhase || room.Race == null) {
                    throw new MultiplayerRoomException("The Race results are not ready.");
                }

                player.HasReturnedToLobby = true;
                ResetRaceWhenEveryoneReturnedLocked(room);
                return ToDto(room);
            }
        }

        private void EnsureRaceCanAcceptAnswerLocked(
            RoomState room,
            PlayerState player,
            int answerSequence,
            int deckId) {
            if (room.Phase == FinishedPhase) {
                throw new MultiplayerRoomException("This Race is finished.");
            }

            if (room.Phase != StartingPhase && room.Phase != RacingPhase) {
                throw new MultiplayerRoomException("This Race is not active.");
            }

            if (UtcNow < room.Race!.StartsAtUtc) {
                throw new MultiplayerRoomException("The Race countdown is still running.");
            }

            if (!player.IsConnected) {
                throw new MultiplayerRoomException("The player is not connected.");
            }

            if (!player.IsRaceParticipant || player.IsFinished || player.IsDnf) {
                throw new MultiplayerRoomException("This player has already finished the Race.");
            }

            if (player.SelectedDeckId != deckId) {
                throw new MultiplayerRoomException("This game session does not match the selected Race deck.");
            }

            if (answerSequence <= player.LastAnswerSequence) {
                throw new MultiplayerRoomException("This Race answer was already submitted.");
            }
        }

        private (RoomState Room, PlayerState Player) GetActiveRacePlayerLocked(string userId, string raceId) {
            var room = rooms.Values.FirstOrDefault(candidate =>
                candidate.Race != null &&
                string.Equals(candidate.Race.RaceId, raceId, StringComparison.Ordinal) &&
                candidate.Players.ContainsKey(userId));

            if (room == null) {
                throw new MultiplayerRoomException("The active Race could not be found.");
            }

            return (room, room.Players[userId]);
        }

        private DateTime UtcNow => timeProvider.GetUtcNow().UtcDateTime;

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
            player.ConnectionId = "";
            player.IsConnected = false;

            if ((room.Phase == StartingPhase || room.Phase == RacingPhase) && player.IsRaceParticipant) {
                if (!player.IsFinished) player.IsDnf = true;
                player.HasReturnedToLobby = true;
                FinalizeRaceIfCompleteLocked(room);
                var raceRoom = NormalizeRoomAfterPlayerRemovalLocked(room);
                return new MultiplayerRoomChange(null, null, raceRoom, room.Code);
            }

            if (room.Phase == FinishedPhase && player.IsRaceParticipant) {
                player.HasReturnedToLobby = true;
                ResetRaceWhenEveryoneReturnedLocked(room);
                var finishedRoom = NormalizeRoomAfterPlayerRemovalLocked(room);
                return new MultiplayerRoomChange(null, null, finishedRoom, room.Code);
            }

            room.Players.Remove(player.UserId);
            var updatedRoom = NormalizeRoomAfterPlayerRemovalLocked(room);
            return new MultiplayerRoomChange(null, null, updatedRoom, room.Code);
        }

        private (MultiplayerRoomDto? Room, string? RoomCode) RemoveUserFromExistingRoomLocked(
            string userId,
            string connectionId,
            string? exceptRoomCode) {
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

                if ((room.Phase == StartingPhase || room.Phase == RacingPhase) &&
                    player.IsRaceParticipant) {
                    player.ConnectionId = "";
                    player.IsConnected = false;
                    if (!player.IsFinished) player.IsDnf = true;
                    player.HasReturnedToLobby = true;
                    FinalizeRaceIfCompleteLocked(room);
                }
                else {
                    room.Players.Remove(userId);
                }
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

            if (!room.Players.TryGetValue(room.OwnerUserId, out var owner) || !owner.IsConnected) {
                room.OwnerUserId = room.Players.Values
                    .Where(player => player.IsConnected)
                    .OrderBy(player => player.JoinedAt)
                    .FirstOrDefault()?.UserId ?? room.Players.Values.OrderBy(player => player.JoinedAt).First().UserId;
            }

            return ToDto(room);
        }

        private void FinalizeRaceIfCompleteLocked(RoomState room) {
            if (room.Race == null || room.Phase == FinishedPhase) return;

            var participants = room.Players.Values.Where(player => player.IsRaceParticipant).ToList();
            if (participants.Count == 0 || participants.Any(player => !player.IsFinished && !player.IsDnf)) return;

            room.Phase = FinishedPhase;
            room.Race.FinishedAtUtc = UtcNow;
        }

        private void ResetRaceWhenEveryoneReturnedLocked(RoomState room) {
            if (room.Phase != FinishedPhase) return;

            var waitingPlayers = room.Players.Values
                .Where(player => player.IsConnected && player.IsRaceParticipant)
                .Any(player => !player.HasReturnedToLobby);
            if (waitingPlayers) return;

            room.Phase = LobbyPhase;
            room.Race = null;
            room.NextScoreSequence = 0;

            foreach (var player in room.Players.Values.ToList()) {
                if (!player.IsConnected) {
                    room.Players.Remove(player.UserId);
                    continue;
                }

                player.IsReady = false;
                player.ReadyForSettingsVersion = null;
                player.RaceScore = 0;
                player.ScoreSequence = 0;
                player.LastAnswerSequence = 0;
                player.IsFinished = false;
                player.FinishedAtUtc = null;
                player.Placement = null;
                player.IsDnf = false;
                player.IsRaceParticipant = false;
                player.FinalAccuracy = 0;
                player.BestStreak = 0;
                player.Kills = 0;
                player.RushHoursTriggered = 0;
                player.HasReturnedToLobby = false;
            }

            NormalizeRoomAfterPlayerRemovalLocked(room);
        }

        private (RoomState Room, PlayerState Player) GetRoomAndPlayerLocked(string connectionId) {
            if (!TryGetRoomAndPlayerLocked(connectionId, out var room, out var player)) {
                throw new MultiplayerRoomException("You must be in a multiplayer room.");
            }

            return (room, player);
        }

        private bool TryGetRoomAndPlayerLocked(
            string connectionId,
            out RoomState room,
            out PlayerState player) {
            room = null!;
            player = null!;

            if (!connectionRooms.TryGetValue(connectionId, out var roomCode)) return false;
            if (!rooms.TryGetValue(roomCode, out var foundRoom)) {
                connectionRooms.Remove(connectionId);
                return false;
            }

            room = foundRoom;
            player = room.Players.Values.FirstOrDefault(candidate => candidate.ConnectionId == connectionId)!;
            if (player != null) return true;

            connectionRooms.Remove(connectionId);
            return false;
        }

        private static void EnsureHost(RoomState room, PlayerState player) {
            if (!string.Equals(player.UserId, room.OwnerUserId, StringComparison.Ordinal)) {
                throw new MultiplayerRoomException("Only the host can perform this action.");
            }
        }

        private static IReadOnlyList<string> NormalizeModifiers(IEnumerable<string>? modifiers) {
            var normalized = (modifiers ?? [])
                .Where(modifier => !string.IsNullOrWhiteSpace(modifier))
                .Select(modifier => modifier.Trim())
                .Distinct(StringComparer.Ordinal)
                .ToList();

            if (normalized.Any(modifier => !AllowedModifiers.Contains(modifier))) {
                throw new MultiplayerRoomException("One or more modifiers are not available in multiplayer.");
            }

            return normalized;
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
            if (!RoomCodePattern.IsMatch(normalized) ||
                normalized.Any(character => character != '@' && !CodeCharacters.Contains(character))) {
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
                    player.UserId == room.OwnerUserId,
                    player.IsConnected,
                    player.SelectedDeckId,
                    player.SelectedDeckName,
                    player.DeckWordCount,
                    player.DeckLanguage,
                    player.Direction,
                    player.Modifiers,
                    player.IsReady,
                    player.ReadyForSettingsVersion,
                    player.RaceScore,
                    player.ScoreSequence,
                    player.LastAnswerSequence,
                    player.IsFinished,
                    player.FinishedAtUtc,
                    player.Placement,
                    player.IsDnf,
                    player.FinalAccuracy,
                    player.BestStreak,
                    player.Kills,
                    player.RushHoursTriggered,
                    player.HasReturnedToLobby))
                .ToList();

            return new MultiplayerRoomDto(
                room.Code,
                room.OwnerUserId,
                MaxPlayers,
                room.Phase,
                players,
                new MultiplayerRoomSettingsDto(
                    room.Settings.GameModeId,
                    room.Settings.ScoreCap,
                    room.Settings.SettingsVersion),
                room.Race == null ? null : ToDto(room.Race));
        }

        private static MultiplayerRaceUpdateDto ToRaceUpdateDto(RoomState room) {
            return new MultiplayerRaceUpdateDto(
                room.Code,
                room.Phase,
                ToDto(room.Race!),
                room.Players.Values
                    .OrderBy(player => player.JoinedAt)
                    .Select(player => new MultiplayerRaceLeaderboardPlayerDto(
                        player.UserId,
                        player.RaceScore,
                        player.ScoreSequence,
                        player.LastAnswerSequence,
                        player.IsFinished,
                        player.FinishedAtUtc,
                        player.Placement,
                        player.IsDnf,
                        player.FinalAccuracy,
                        player.BestStreak,
                        player.Kills,
                        player.RushHoursTriggered))
                    .ToList());
        }

        private static MultiplayerRaceDto ToDto(RaceState race) {
            return new MultiplayerRaceDto(
                race.RaceId,
                race.ScoreCap,
                race.StartsAtUtc,
                race.StartedAtUtc,
                race.WinnerUserId,
                race.FinishedAtUtc);
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
            public string Phase { get; set; } = LobbyPhase;
            public Dictionary<string, PlayerState> Players { get; } = new(StringComparer.Ordinal);
            public RoomSettingsState Settings { get; }
            public RaceState? Race { get; set; }
            public long NextScoreSequence { get; set; }
        }

        private sealed class RoomSettingsState {
            public string GameModeId { get; set; } = RaceGameModeId;
            public int ScoreCap { get; set; } = DefaultRaceScoreCap;
            public int SettingsVersion { get; set; } = 1;
        }

        private sealed class RaceState {
            public string RaceId { get; init; } = "";
            public int ScoreCap { get; init; }
            public DateTime StartsAtUtc { get; init; }
            public DateTime? StartedAtUtc { get; set; }
            public string? WinnerUserId { get; set; }
            public DateTime? FinishedAtUtc { get; set; }
            public int FinishCount { get; set; }
        }

        private sealed class PlayerState {
            public string UserId { get; init; } = "";
            public string Username { get; set; } = "";
            public string? ProfileImageUrl { get; set; }
            public string? CountryCode { get; set; }
            public string ConnectionId { get; set; } = "";
            public bool IsConnected { get; set; } = true;
            public DateTime JoinedAt { get; init; }
            public int? SelectedDeckId { get; set; }
            public string? SelectedDeckName { get; set; }
            public int? DeckWordCount { get; set; }
            public string? DeckLanguage { get; set; }
            public string? Direction { get; set; }
            public IReadOnlyList<string> Modifiers { get; set; } = [];
            public bool IsReady { get; set; }
            public int? ReadyForSettingsVersion { get; set; }
            public int RaceScore { get; set; }
            public long ScoreSequence { get; set; }
            public int LastAnswerSequence { get; set; }
            public bool IsFinished { get; set; }
            public DateTime? FinishedAtUtc { get; set; }
            public int? Placement { get; set; }
            public bool IsDnf { get; set; }
            public bool IsRaceParticipant { get; set; }
            public double FinalAccuracy { get; set; }
            public int BestStreak { get; set; }
            public int Kills { get; set; }
            public int RushHoursTriggered { get; set; }
            public bool HasReturnedToLobby { get; set; }

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
