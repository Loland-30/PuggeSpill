namespace LexiGo.Api.Models {
    public class GameSession {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int DeckId { get; set; }
        // public Enemies CurrentEnemy { get; set; } = Enemies.yoMama; //
        public int CurrentWordId { get; set; }
        public int StreakCount {get; set; }
        public int FinalScore { get; set; }
        public int Lives { get; set; }
        public bool IsActive { get; set; }
        public int? RoundLimit { get; set; } // null = endless -> Thinker
        public int QuestionsAnswered { get; set; }
        
        public Deck Deck { get; set; } = null!;
        public Word CurrentWord { get; set; } = null!;
        public User? User { get; set; }
        
    }
}
