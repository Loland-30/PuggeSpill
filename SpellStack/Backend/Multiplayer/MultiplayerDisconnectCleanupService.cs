using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;

namespace SpellStack.Api.Multiplayer {
    public sealed class MultiplayerDisconnectCleanupService : IDisposable {
        private static readonly TimeSpan DisconnectGracePeriod = TimeSpan.FromSeconds(20);
        private readonly ConcurrentDictionary<string, CancellationTokenSource> pendingDisconnects = new(StringComparer.Ordinal);
        private readonly MultiplayerRoomService rooms;
        private readonly IHubContext<MultiplayerHub> hubContext;
        private readonly ILogger<MultiplayerDisconnectCleanupService> logger;

        public MultiplayerDisconnectCleanupService(
            MultiplayerRoomService rooms,
            IHubContext<MultiplayerHub> hubContext,
            ILogger<MultiplayerDisconnectCleanupService> logger) {
            this.rooms = rooms;
            this.hubContext = hubContext;
            this.logger = logger;
        }

        public void Cancel(string connectionId) {
            if (!pendingDisconnects.TryRemove(connectionId, out var cancellation)) return;

            cancellation.Cancel();
            cancellation.Dispose();
        }

        public void Schedule(string connectionId) {
            Cancel(connectionId);

            var cancellation = new CancellationTokenSource();
            if (!pendingDisconnects.TryAdd(connectionId, cancellation)) {
                cancellation.Dispose();
                return;
            }

            _ = RunDelayedCleanup(connectionId, cancellation);
        }

        private async Task RunDelayedCleanup(string connectionId, CancellationTokenSource cancellation) {
            try {
                await Task.Delay(DisconnectGracePeriod, cancellation.Token);

                if (!pendingDisconnects.TryRemove(connectionId, out var currentCancellation) || currentCancellation != cancellation) {
                    return;
                }

                var change = rooms.CompleteDisconnect(connectionId);
                if (change?.PreviousRoomCode != null && change.PreviousRoom != null) {
                    await hubContext.Clients.Group(change.PreviousRoomCode).SendAsync("RoomUpdated", change.PreviousRoom);
                }
            }
            catch (OperationCanceledException) {
                // Expected when a user reconnects or explicitly leaves before the grace period expires.
            }
            catch (Exception exception) {
                logger.LogError(exception, "Failed to clean up disconnected multiplayer connection {ConnectionId}.", connectionId);
            }
            finally {
                cancellation.Dispose();
            }
        }

        public void Dispose() {
            foreach (var item in pendingDisconnects.ToArray()) {
                if (!pendingDisconnects.TryRemove(item.Key, out var cancellation)) continue;

                cancellation.Cancel();
                cancellation.Dispose();
            }
        }
    }
}
