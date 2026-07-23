using System.Collections.Concurrent;

namespace SpellStack.Api.Services {
    public class TranslationRequestLimiter {
        private const int RequestsPerWindow = 20;
        private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);
        private readonly ConcurrentDictionary<int, Queue<DateTime>> requestTimes = new();

        public bool TryConsume(int userId) {
            var now = DateTime.UtcNow;
            var queue = requestTimes.GetOrAdd(userId, _ => new Queue<DateTime>());

            lock (queue) {
                while (queue.Count > 0 && now - queue.Peek() >= Window) {
                    queue.Dequeue();
                }

                if (queue.Count >= RequestsPerWindow) return false;
                queue.Enqueue(now);
                return true;
            }
        }
    }
}
