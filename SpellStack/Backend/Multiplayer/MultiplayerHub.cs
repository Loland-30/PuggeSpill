using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SpellStack.Api.Multiplayer {
    [Authorize]
    public class MultiplayerHub : Hub {
        private readonly MultiplayerRoomService rooms;

        public MultiplayerHub(MultiplayerRoomService rooms) {
            this.rooms = rooms;
        }

        public async Task<MultiplayerRoomDto> CreateRoom() {
            try {
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
                var change = rooms.JoinRoom(roomCode, GetCurrentUser(), Context.ConnectionId);
                await SyncGroupsAndBroadcast(change);
                return change.CurrentRoom ?? throw new HubException("Could not join room.");
            }
            catch (MultiplayerRoomException exception) {
                throw new HubException(exception.Message);
            }
        }

        public async Task LeaveRoom() {
            var change = rooms.LeaveRoom(Context.ConnectionId);
            if (change == null) return;

            if (!string.IsNullOrWhiteSpace(change.PreviousRoomCode)) {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, change.PreviousRoomCode);
                if (change.PreviousRoom != null) {
                    await Clients.Group(change.PreviousRoomCode).SendAsync("RoomUpdated", change.PreviousRoom);
                }
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception) {
            var change = rooms.Disconnect(Context.ConnectionId);
            if (change?.PreviousRoomCode != null && change.PreviousRoom != null) {
                await Clients.Group(change.PreviousRoomCode).SendAsync("RoomUpdated", change.PreviousRoom);
            }

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

            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(username)) {
                throw new HubException("You must be signed in to use multiplayer.");
            }

            return new MultiplayerUser(userId, username, profileImageUrl);
        }
    }
}
