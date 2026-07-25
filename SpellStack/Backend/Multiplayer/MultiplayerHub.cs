using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SpellStack.Api.Data;

namespace SpellStack.Api.Multiplayer {
    [Authorize]
    public class MultiplayerHub : Hub {
        private readonly MultiplayerRoomService rooms;
        private readonly MultiplayerDisconnectCleanupService disconnectCleanup;
        private readonly AppDbContext db;

        public MultiplayerHub(
            MultiplayerRoomService rooms,
            MultiplayerDisconnectCleanupService disconnectCleanup,
            AppDbContext db) {
            this.rooms = rooms;
            this.disconnectCleanup = disconnectCleanup;
            this.db = db;
        }

        public async Task<MultiplayerRoomDto> CreateRoom() {
            try {
                disconnectCleanup.Cancel(Context.ConnectionId);
                var change = rooms.CreateRoom(GetCurrentUser(), Context.ConnectionId);
                await SyncGroupsAndBroadcast(change);
                return change.CurrentRoom ?? throw new HubException("Could not create room.");
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task<MultiplayerRoomDto> JoinRoom(string roomCode) {
            try {
                disconnectCleanup.Cancel(Context.ConnectionId);
                var change = rooms.JoinRoom(roomCode, GetCurrentUser(), Context.ConnectionId);
                await SyncGroupsAndBroadcast(change);
                return change.CurrentRoom ?? throw new HubException("Could not join room.");
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task LeaveRoom() {
            disconnectCleanup.Cancel(Context.ConnectionId);
            var change = rooms.LeaveRoom(Context.ConnectionId);
            if (change == null) return;

            if (!string.IsNullOrWhiteSpace(change.PreviousRoomCode)) {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, change.PreviousRoomCode);
                if (change.PreviousRoom != null) {
                    await Clients.Group(change.PreviousRoomCode).SendAsync("RoomUpdated", change.PreviousRoom);
                }
            }
        }

        public async Task<MultiplayerRoomDto> UpdateRoomSettings(string gameModeId, int scoreCap) {
            try {
                var room = rooms.UpdateRoomSettings(Context.ConnectionId, gameModeId, scoreCap);
                await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
                return room;
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task<MultiplayerRoomDto> SetReady(
            int selectedDeckId,
            string direction,
            string[]? modifiers,
            int settingsVersion) {
            try {
                var user = GetCurrentUser();
                if (!int.TryParse(user.UserId, out var userId)) {
                    throw new MultiplayerRoomException("Could not validate the current player.");
                }

                var deck = await db.Decks
                    .AsNoTracking()
                    .Include(candidate => candidate.Words)
                    .FirstOrDefaultAsync(candidate => candidate.Id == selectedDeckId && candidate.UserId == userId);

                if (deck == null) {
                    throw new MultiplayerRoomException("The selected deck could not be found.");
                }

                var room = rooms.SetReady(
                    Context.ConnectionId,
                    deck.Id,
                    deck.Name,
                    deck.Words.Count,
                    direction,
                    modifiers ?? [],
                    settingsVersion);

                await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
                return room;
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task<MultiplayerRoomDto> SetUnready() {
            try {
                var room = rooms.SetUnready(Context.ConnectionId);
                await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
                return room;
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task<MultiplayerRoomDto> StartRace() {
            try {
                var room = rooms.StartRace(Context.ConnectionId);
                await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
                return room;
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception) {
            var room = rooms.MarkDisconnected(Context.ConnectionId);
            if (room != null) {
                await Clients.OthersInGroup(room.Code).SendAsync("RoomUpdated", room);
            }

            disconnectCleanup.Schedule(Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        private async Task SyncGroupsAndBroadcast(MultiplayerRoomChange change) {
            if (!string.IsNullOrWhiteSpace(change.PreviousRoomCode)) {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, change.PreviousRoomCode);
                if (change.PreviousRoom != null) {
                    await Clients.Group(change.PreviousRoomCode).SendAsync("RoomUpdated", change.PreviousRoom);
                }
            }

            if (change.CurrentRoom != null && !string.IsNullOrWhiteSpace(change.CurrentRoomCode)) {
                await Groups.AddToGroupAsync(Context.ConnectionId, change.CurrentRoomCode);
                await Clients.Group(change.CurrentRoomCode).SendAsync("RoomUpdated", change.CurrentRoom);
            }
        }

        private MultiplayerUser GetCurrentUser() {
            var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var username = Context.User?.FindFirstValue(ClaimTypes.Name);
            var profileImageUrl = Context.User?.FindFirstValue("profileImageUrl");
            var countryCode = Context.User?.FindFirstValue("countryCode");

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(username)) {
                throw new HubException("You must be signed in to use multiplayer.");
            }

            return new MultiplayerUser(userId, username, profileImageUrl, countryCode);
        }
    }
}
