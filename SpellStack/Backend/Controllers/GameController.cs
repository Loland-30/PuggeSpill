using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using SpellStack.Api.Data;
using SpellStack.Api.Models;
using SpellStack.Api.Multiplayer;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {

    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase {

        private readonly AppDbContext _context;
        private readonly AchievementService _achievementService;
        private readonly MultiplayerRoomService _multiplayerRooms;
        private readonly IHubContext<MultiplayerHub> _multiplayerHub;
        private readonly ActiveGameRunStore _activeGameRuns;
        private readonly ILogger<GameController> _logger;
        private const int MomentumStackInterval = 5;
        private const int MomentumMaxStacks = 5;
        private const double MomentumScoreMultiplierPerStack = 0.08;

        public GameController(
            AppDbContext context,
            AchievementService achievementService,
            MultiplayerRoomService multiplayerRooms,
            IHubContext<MultiplayerHub> multiplayerHub,
            ActiveGameRunStore activeGameRuns,
            ILogger<GameController> logger) {
            _context = context;
            _achievementService = achievementService;
            _multiplayerRooms = multiplayerRooms;
            _multiplayerHub = multiplayerHub;
            _activeGameRuns = activeGameRuns;
            _logger = logger;
        }

        [HttpPost("start/{deckId}")]
        public async Task<IActionResult> StartGame(int deckId, [FromBody] StartGameRequest? request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var deck = await _context.Decks
                .Include(d => d.Words)
                .FirstOrDefaultAsync(d => d.Id == deckId && d.UserId == user.Id);

            if (deck == null) return NotFound();
            if (!deck.Words.Any()) return BadRequest("Deck har ingen ord");

            var shuffled = deck.Words.OrderBy(_ => Guid.NewGuid()).ToList();
            var firstWord = shuffled.First();

            var modifiers = NormalizeModifiers(request?.Modifiers, request?.Modifier);
            var roundLimit = NormalizeRoundLimit(request?.RoundLimit);

            var session = new GameSession {
                UserId = user.Id,
                DeckId = deckId,
                CurrentWordId = firstWord.Id,
                CurrentWord = firstWord,
                StreakCount = 0,
                FinalScore = 0,
                Lives = GetStartingLives(modifiers),
                IsActive = true,
                RoundLimit = roundLimit,
                QuestionsAnswered = 0,
                CorrectAnswers = 0,
                WrongAnswers = 0,
                BestStreak = 0,
                RushHoursTriggered = 0,
                RushHoursCompleted = 0,
                ResultSaved = false,
                ModifiersJson = JsonSerializer.Serialize(modifiers)
            };

            _context.GameSessions.Add(session);
            await _context.SaveChangesAsync();

            var wordSnapshots = shuffled.Select(ActiveGameWordSnapshot.FromWord).ToArray();
            var activeRun = _activeGameRuns.CreateRun(
                session.Id,
                user.Id,
                deck.Id,
                wordSnapshots,
                firstWord.Id);
            await _activeGameRuns.WithSessionLockAsync(
                session.Id,
                lockedRun => {
                    lockedRun.Set(activeRun);
                    return Task.FromResult(true);
                },
                HttpContext.RequestAborted);

            return Ok(session);
        }

        [HttpPost("answer/{id}")]
        public async Task<IActionResult> Answer(int id, [FromBody] AnswerRequest request) {
            var totalStopwatch = Stopwatch.StartNew();
            int? userId = null;

            try {
                var stageStopwatch = Stopwatch.StartNew();
                var user = await GetCurrentUser();
                stageStopwatch.Stop();
                userId = user?.Id;
                LogAnswerTiming(id, userId, "authentication", stageStopwatch.ElapsedMilliseconds);
                if (user == null) return Unauthorized();

                return await _activeGameRuns.WithSessionLockAsync<IActionResult>(
                    id,
                    async lockedRun => {
                        stageStopwatch.Restart();
                        var session = await _context.GameSessions
                            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);
                        stageStopwatch.Stop();
                        LogAnswerTiming(id, user.Id, "game_session_lookup", stageStopwatch.ElapsedMilliseconds);

                        if (session == null) return NotFound();
                        if (!session.IsActive) {
                            lockedRun.Clear();
                            return BadRequest("Session er ikke aktiv");
                        }

                        stageStopwatch.Restart();
                        var activeRun = lockedRun.Run;
                        var rebuilt = false;

                        if (activeRun == null ||
                            activeRun.UserId != user.Id ||
                            activeRun.DeckId != session.DeckId) {
                            var words = await _context.Words
                                .AsNoTracking()
                                .Where(word =>
                                    word.DeckId == session.DeckId &&
                                    word.Deck.UserId == user.Id)
                                .Select(word => new ActiveGameWordSnapshot(
                                    word.Id,
                                    word.DeckId,
                                    word.Original,
                                    word.Translation,
                                    word.AlternativeOriginal,
                                    word.AlternativeTranslation,
                                    word.Hint))
                                .ToListAsync();

                            if (words.Count == 0 ||
                                words.All(word => word.Id != session.CurrentWordId)) {
                                return Conflict("The active game could not be restored. Please start a new run.");
                            }

                            activeRun = _activeGameRuns.CreateRun(
                                session.Id,
                                user.Id,
                                session.DeckId,
                                words,
                                session.CurrentWordId);
                            lockedRun.Set(activeRun);
                            rebuilt = true;
                        }

                        stageStopwatch.Stop();
                        _logger.LogInformation(
                            "Game answer timing for session {GameSessionId}, user {UserId}: {Stage} took {ElapsedMs} ms (rebuilt: {Rebuilt}).",
                            id,
                            user.Id,
                            "active_run_lookup",
                            stageStopwatch.ElapsedMilliseconds,
                            rebuilt);

                        var currentWord = activeRun.CurrentWord;
                        var isMultiplayerRace = !string.IsNullOrWhiteSpace(request.MultiplayerRaceId);

                        if (isMultiplayerRace) {
                            if (!request.MultiplayerAnswerSequence.HasValue) {
                                return BadRequest("Multiplayer answer sequence is required.");
                            }

                            try {
                                _multiplayerRooms.ValidateRaceAnswer(
                                    user.Id.ToString(),
                                    request.MultiplayerRaceId!,
                                    request.MultiplayerAnswerSequence.Value,
                                    session.DeckId);
                            }
                            catch (MultiplayerRoomException exception) {
                                return BadRequest(exception.Message);
                            }
                        }

                        var previousFinalScore = session.FinalScore;
                        var direction = request.Direction?.ToLowerInvariant() == "translation"
                            ? "translation"
                            : "original";

                        var modifiers = GetSessionModifiers(session, request.Modifiers, request.Modifier);
                        stageStopwatch.Restart();
                        var correct = IsAnswerCorrect(currentWord, request.Answer, direction);
                        stageStopwatch.Stop();
                        LogAnswerTiming(id, user.Id, "answer_evaluation", stageStopwatch.ElapsedMilliseconds);
                        var responseTimeSeconds = ClampDuration(request.ResponseTimeSeconds);

                        if (responseTimeSeconds.HasValue) {
                            session.TotalResponseTimeSeconds =
                                (session.TotalResponseTimeSeconds ?? 0) + responseTimeSeconds.Value;
                        }

                        var rushHourElapsedSeconds = ClampDuration(request.RushHourElapsedSeconds);
                        if (rushHourElapsedSeconds.HasValue) {
                            session.LongestRushHourDurationSeconds = Math.Max(
                                session.LongestRushHourDurationSeconds ?? 0,
                                rushHourElapsedSeconds.Value);
                        }

                        if (correct) {
                            var nextStreak = session.StreakCount + 1;
                            var timeBonus = Math.Max(0, request.TimeLeft ?? 0) * 5;
                            var streakBonus = nextStreak >= 3 ? nextStreak * 25 : 0;
                            var momentumStacks = modifiers.Contains("momentum")
                                ? GetMomentumStacks(nextStreak)
                                : 0;

                            var score = modifiers.Contains("zen") ? 0 : 100 + timeBonus + streakBonus;
                            score = (int)Math.Round(score * GetScoreMultiplier(modifiers, momentumStacks));

                            session.FinalScore += score;
                            session.StreakCount = nextStreak;
                            session.CorrectAnswers++;
                            session.BestStreak = Math.Max(session.BestStreak, nextStreak);
                        } else {
                            var shouldLoseLife = !isMultiplayerRace && !modifiers.Contains("zen");

                            if (shouldLoseLife) session.Lives--;

                            session.StreakCount = 0;
                            session.WrongAnswers++;
                        }

                        session.QuestionsAnswered++;

                        if (isMultiplayerRace &&
                            request.MultiplayerAnswerSequence.HasValue) {
                            try {
                                var raceUpdate = _multiplayerRooms.RecordRaceAnswer(
                                    user.Id.ToString(),
                                    request.MultiplayerRaceId!,
                                    request.MultiplayerAnswerSequence.Value,
                                    session.DeckId,
                                    session.FinalScore - previousFinalScore,
                                    session.CorrectAnswers,
                                    session.QuestionsAnswered,
                                    session.BestStreak,
                                    session.RushHoursTriggered,
                                    correct && request.EnemyDefeated == true);

                                if (raceUpdate != null) {
                                    await _multiplayerHub.Clients
                                        .Group(raceUpdate.RoomCode)
                                        .SendAsync("RaceUpdated", raceUpdate);
                                }
                            }
                            catch (MultiplayerRoomException exception) {
                                return BadRequest(exception.Message);
                            }
                        }

                        if (!isMultiplayerRace && session.Lives <= 0) {
                            await FinishSession(session, "gameOver");
                            stageStopwatch.Restart();
                            await _context.SaveChangesAsync();
                            stageStopwatch.Stop();
                            LogAnswerTiming(id, user.Id, "save_changes", stageStopwatch.ElapsedMilliseconds);
                            lockedRun.Clear();
                            session.CurrentWord = currentWord.ToWord();
                            var newlyUnlockedAchievements =
                                await _achievementService.UnlockNewAchievements(user.Id);

                            return Ok(new {
                                correct,
                                session,
                                gameOver = true,
                                gameComplete = false,
                                newlyUnlockedAchievements
                            });
                        }

                        if (session.RoundLimit.HasValue &&
                            session.QuestionsAnswered >= session.RoundLimit.Value) {
                            await FinishSession(session, "completed");
                            stageStopwatch.Restart();
                            await _context.SaveChangesAsync();
                            stageStopwatch.Stop();
                            LogAnswerTiming(id, user.Id, "save_changes", stageStopwatch.ElapsedMilliseconds);
                            lockedRun.Clear();
                            session.CurrentWord = currentWord.ToWord();
                            var newlyUnlockedAchievements =
                                await _achievementService.UnlockNewAchievements(user.Id);

                            return Ok(new {
                                correct,
                                session,
                                gameOver = false,
                                gameComplete = true,
                                newlyUnlockedAchievements
                            });
                        }

                        var nextWord = activeRun.SelectNext(DateTime.UtcNow);
                        session.CurrentWordId = nextWord.Id;

                        stageStopwatch.Restart();
                        await _context.SaveChangesAsync();
                        stageStopwatch.Stop();
                        LogAnswerTiming(id, user.Id, "save_changes", stageStopwatch.ElapsedMilliseconds);

                        // Set the detached snapshot only after persistence so EF never tracks cached words.
                        session.CurrentWord = nextWord.ToWord();

                        return Ok(new {
                            correct,
                            session,
                            gameOver = false,
                            gameComplete = false
                        });
                    },
                    HttpContext.RequestAborted);
            }
            finally {
                totalStopwatch.Stop();
                LogAnswerTiming(id, userId, "total", totalStopwatch.ElapsedMilliseconds);
            }
        }

        [HttpGet("state/{id}")]
        public async Task<IActionResult> GetState(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.CurrentWord)
                .Include(s => s.Deck)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();

            return Ok(session);
        }

        [HttpPost("end/{id}")]
        public async Task<IActionResult> EndGame(int id) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            return await _activeGameRuns.WithSessionLockAsync<IActionResult>(
                id,
                async lockedRun => {
                    var session = await _context.GameSessions
                        .Include(s => s.Deck)
                        .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

                    if (session == null) return NotFound();

                    var result = await FinishSession(session, "endedByUser");
                    await _context.SaveChangesAsync();
                    lockedRun.Clear();

                    var newlyUnlockedAchievements =
                        await _achievementService.UnlockNewAchievements(user.Id);

                    return Ok(new {
                        highScore = result.HighScore,
                        isNewHighScore = result.IsNewHighScore,
                        newlyUnlockedAchievements
                    });
                },
                HttpContext.RequestAborted);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory([FromQuery] string? language, [FromQuery] int? limit) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var take = Math.Clamp(limit ?? 10, 1, 100);
            var normalizedLanguage = language?.Trim().ToLowerInvariant();

            var query = _context.GameRunResults
                .AsNoTracking()
                .Include(run => run.Deck)
                .Where(run =>
                    run.UserId == user.Id &&
                    (run.EndReason == "completed" || run.EndReason == "gameOver"));

            if (!string.IsNullOrWhiteSpace(normalizedLanguage)) {
                query = query.Where(run => run.LanguageCode.ToLower() == normalizedLanguage);
            }

            var runs = await query
                .OrderByDescending(run => run.CompletedAt)
                .Take(take)
                .Select(run => new {
                    run.Id,
                    run.DeckId,
                    deckName = run.Deck.Name,
                    run.GameSessionId,
                    run.LanguageCode,
                    run.FinalScore,
                    run.CorrectAnswers,
                    run.WrongAnswers,
                    run.TotalAnswers,
                    run.AccuracyPercent,
                    run.BestStreak,
                    run.HighestCombo,
                    run.AverageResponseTimeSeconds,
                    run.RushHoursTriggered,
                    run.RushHoursCompleted,
                    run.LongestRushHourDurationSeconds,
                    run.RoundLimit,
                    run.CompletedAt,
                    run.EndReason,
                    run.ModifiersJson
                })
                .ToListAsync();

            return Ok(runs);
        }

        [HttpPost("rush-hour/{id}/start")]
        public async Task<IActionResult> StartRushHour(int id, [FromBody] RushHourStartRequest? request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();
            if (!session.IsActive) return BadRequest("Session er ikke aktiv");

            if (!string.IsNullOrWhiteSpace(request?.MultiplayerRaceId)) {
                try {
                    var started = _multiplayerRooms.StartRaceRushHour(
                        user.Id.ToString(),
                        request.MultiplayerRaceId,
                        session.DeckId);

                    if (!started) return Conflict("Rush Hour is already active.");
                }
                catch (MultiplayerRoomException exception) {
                    return BadRequest(exception.Message);
                }
            }

            session.RushHoursTriggered++;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("rush-hour/{id}/complete")]
        public async Task<IActionResult> CompleteRushHour(int id, [FromBody] RushHourCompleteRequest request) {
            var user = await GetCurrentUser();
            if (user == null) return Unauthorized();

            var session = await _context.GameSessions
                .Include(s => s.CurrentWord)
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == user.Id);

            if (session == null) return NotFound();
            if (!session.IsActive) return BadRequest("Session er ikke aktiv");

            var bonusScore = Math.Max(0, request.BonusScore);
            MultiplayerRaceUpdateDto? raceUpdate = null;
            var rushHourApplied = true;

            if (!string.IsNullOrWhiteSpace(request.MultiplayerRaceId)) {
                try {
                    var raceResult = _multiplayerRooms.EndRaceRushHour(
                        user.Id.ToString(),
                        request.MultiplayerRaceId,
                        session.DeckId,
                        request.Cleared != false);

                    rushHourApplied = raceResult.Applied;
                    bonusScore = raceResult.BonusScore;
                    raceUpdate = raceResult.RaceUpdate;
                }
                catch (MultiplayerRoomException exception) {
                    return BadRequest(exception.Message);
                }
            }

            if (rushHourApplied) {
                session.FinalScore += bonusScore;
                if (request.Cleared != false) session.RushHoursCompleted++;
            }

            var durationSeconds = ClampDuration(request.DurationSeconds);
            if (durationSeconds.HasValue) {
                session.LongestRushHourDurationSeconds = Math.Max(
                    session.LongestRushHourDurationSeconds ?? 0,
                    durationSeconds.Value);
            }

            await _context.SaveChangesAsync();

            if (raceUpdate != null) {
                await _multiplayerHub.Clients
                    .Group(raceUpdate.RoomCode)
                    .SendAsync("RaceUpdated", raceUpdate);
            }

            return Ok(session);
        }

        private async Task<FinishSessionResult> FinishSession(GameSession session, string endReason) {
            session.IsActive = false;

            if (session.Deck == null) {
                await _context.Entry(session).Reference(s => s.Deck).LoadAsync();
            }

            var deck = session.Deck ?? throw new InvalidOperationException("Game session is missing its deck.");

            var isNewHighScore = session.FinalScore > deck.HighScore;
            if (isNewHighScore) {
                deck.HighScore = session.FinalScore;
            }

            var resultAlreadySaved = session.ResultSaved ||
                await _context.GameRunResults.AnyAsync(result => result.GameSessionId == session.Id);

            if (!resultAlreadySaved) {
                var totalAnswers = Math.Max(session.QuestionsAnswered, session.CorrectAnswers + session.WrongAnswers);
                var accuracyPercent = totalAnswers == 0
                    ? 0
                    : Math.Round(session.CorrectAnswers * 100.0 / totalAnswers, 2);
                var averageResponseTimeSeconds =
                    totalAnswers > 0 && session.TotalResponseTimeSeconds.HasValue
                        ? Math.Round(session.TotalResponseTimeSeconds.Value / totalAnswers, 3)
                        : (double?)null;

                _context.GameRunResults.Add(new GameRunResult {
                    UserId = session.UserId,
                    DeckId = session.DeckId,
                    GameSessionId = session.Id,
                    LanguageCode = GetRunLanguageCode(deck),
                    FinalScore = session.FinalScore,
                    CorrectAnswers = session.CorrectAnswers,
                    WrongAnswers = session.WrongAnswers,
                    TotalAnswers = totalAnswers,
                    AccuracyPercent = accuracyPercent,
                    BestStreak = session.BestStreak,
                    HighestCombo = session.BestStreak,
                    AverageResponseTimeSeconds = averageResponseTimeSeconds,
                    RushHoursTriggered = session.RushHoursTriggered,
                    RushHoursCompleted = session.RushHoursCompleted,
                    LongestRushHourDurationSeconds = session.LongestRushHourDurationSeconds,
                    RoundLimit = session.RoundLimit,
                    CompletedAt = DateTime.UtcNow,
                    EndReason = endReason,
                    ModifiersJson = session.ModifiersJson
                });

                session.ResultSaved = true;
            }

            return new FinishSessionResult(deck.HighScore, isNewHighScore);
        }

        private static string GetRunLanguageCode(Deck deck) {
            if (!string.IsNullOrWhiteSpace(deck.LearningLanguage)) return deck.LearningLanguage;
            if (!string.IsNullOrWhiteSpace(deck.TranslationLanguage)) return deck.TranslationLanguage;
            return deck.Language;
        }

        private static double? ClampDuration(double? durationSeconds) {
            if (!durationSeconds.HasValue || double.IsNaN(durationSeconds.Value) ||
                double.IsInfinity(durationSeconds.Value)) {
                return null;
            }

            return Math.Clamp(durationSeconds.Value, 0, 300);
        }

        private static bool IsAnswerCorrect(
            ActiveGameWordSnapshot word,
            string answer,
            string direction) {
            if (direction == "translation") {
                return AnswerEvaluator.IsAccepted(
                    answer,
                    word.Original,
                    word.AlternativeOriginal);
            }

            return AnswerEvaluator.IsAccepted(
                answer,
                word.Translation,
                word.AlternativeTranslation);
        }

        private void LogAnswerTiming(
            int gameSessionId,
            int? userId,
            string stage,
            long elapsedMilliseconds) {
            _logger.LogInformation(
                "Game answer timing for session {GameSessionId}, user {UserId}: {Stage} took {ElapsedMs} ms.",
                gameSessionId,
                userId,
                stage,
                elapsedMilliseconds);
        }

        private static int GetStartingLives(IReadOnlyCollection<string> modifiers) {
            if (modifiers.Contains("hardcore")) return 1;

            var lives = modifiers.Contains("zen") ? 4 : 3;
            if (modifiers.Contains("extraheart")) lives++;

            return lives;
        }

        private static int GetMomentumStacks(int streakCount) {
            return Math.Clamp(streakCount / MomentumStackInterval, 0, MomentumMaxStacks);
        }

        private static double GetScoreMultiplier(IReadOnlyCollection<string> modifiers, int momentumStacks = 0) {
            if (modifiers.Contains("zen")) return 0;

            var multiplier = 1.0;

            if (modifiers.Contains("extraheart")) multiplier *= 0.75;
            if (modifiers.Contains("hardcore")) multiplier *= 1.5;
            if (modifiers.Contains("momentum")) multiplier *= 1.25;
            if (modifiers.Contains("hidden")) multiplier *= 1.3;
            if (modifiers.Contains("notime")) multiplier *= 1.35;

            if (momentumStacks > 0) {
                multiplier *= 1 + (momentumStacks * MomentumScoreMultiplierPerStack);
            }

            return multiplier;
        }

        private static int? NormalizeRoundLimit(int? roundLimit) {
            return roundLimit switch {
                null => null,
                10 => 10,
                25 => 25,
                50 => 50,
                100 => 100,
                _ => 25
            };
        }

        private static IReadOnlyCollection<string> NormalizeModifiers(string[]? modifiers, string? legacyModifier) {
            var normalized = (modifiers ?? Array.Empty<string>())
                .Select(NormalizeModifier)
                .Where(modifier => modifier != "normal")
                .Distinct()
                .ToList();

            var normalizedLegacyModifier = NormalizeModifier(legacyModifier);
            if (normalizedLegacyModifier != "normal" && !normalized.Contains(normalizedLegacyModifier)) {
                normalized.Add(normalizedLegacyModifier);
            }

            if (normalized.Contains("zen")) {
                normalized.Remove("momentum");
                normalized.Remove("notime");
            }

            return normalized;
        }

        private static IReadOnlyCollection<string> GetSessionModifiers(
            GameSession session,
            string[]? fallbackModifiers = null,
            string? fallbackLegacyModifier = null
        ) {
            if (!string.IsNullOrWhiteSpace(session.ModifiersJson)) {
                try {
                    var storedModifiers = JsonSerializer.Deserialize<string[]>(session.ModifiersJson);
                    if (storedModifiers is { Length: > 0 }) {
                        return NormalizeModifiers(storedModifiers, null);
                    }
                } catch (JsonException) {
                    // Older/dev sessions may contain malformed modifier JSON. Fall back to the request payload.
                }
            }

            return NormalizeModifiers(fallbackModifiers, fallbackLegacyModifier);
        }

        private static string NormalizeModifier(string? modifier) {
            return modifier?.ToLowerInvariant() switch {
                "zen" => "zen",
                "extraheart" => "extraheart",
                "hardcore" => "hardcore",
                "momentum" => "momentum",
                "hidden" => "hidden",
                "notime" => "notime",
                _ => "normal"
            };
        }

        private async Task<User?> GetCurrentUser() {
            var token = GetBearerToken();
            if (token == null) return null;

            var tokenHash = SessionTokenHasher.Hash(token);
            var session = await _context.UserSessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.TokenHash == tokenHash && s.ExpiresAt > DateTime.UtcNow);

            return session?.User;
        }

        private string? GetBearerToken() {
            var header = Request.Headers.Authorization.ToString();

            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) {
                return null;
            }

            return header["Bearer ".Length..].Trim();
        }
    }

    public record StartGameRequest(string? Modifier, string[]? Modifiers, int? RoundLimit);

    public record AnswerRequest(
        string Answer,
        string? Direction,
        int? TimeLeft,
        string? Modifier,
        string[]? Modifiers,
        double? ResponseTimeSeconds,
        double? RushHourElapsedSeconds,
        string? MultiplayerRaceId,
        int? MultiplayerAnswerSequence,
        bool? EnemyDefeated
    );

    public record RushHourStartRequest(string? MultiplayerRaceId);
    public record RushHourCompleteRequest(
        int BonusScore,
        double? DurationSeconds,
        string? MultiplayerRaceId,
        bool? Cleared);
    public record FinishSessionResult(int HighScore, bool IsNewHighScore);
}
