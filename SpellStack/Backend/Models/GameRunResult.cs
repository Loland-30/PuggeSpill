namespace LexiGo.Api.Models {
    public class GameRunResult {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DeckId { get; set; }
        public int? GameSessionId { get; set; }
        public string LanguageCode { get; set; } = "";
        public int FinalScore { get; set; }
        public int CorrectAnswers { get; set; }
        public int WrongAnswers { get; set; }
        public int TotalAnswers { get; set; }
        public double AccuracyPercent { get; set; }
        public int BestStreak { get; set; }
        public int HighestCombo { get; set; }
        public double? AverageResponseTimeSeconds { get; set; }
        public int RushHoursTriggered { get; set; }
        public int RushHoursCompleted { get; set; }
        public double? LongestRushHourDurationSeconds { get; set; }
        public int? RoundLimit { get; set; }
        public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
        public string EndReason { get; set; } = "";
        public string ModifiersJson { get; set; } = "";

        public User? User { get; set; }
        public Deck Deck { get; set; } = null!;
        public GameSession? GameSession { get; set; }
    }
}
