namespace SpellStack.Api.Models {
    public class UpdatePost {
        public int Id { get; set; }
        public string Slug { get; set; } = "";
        public string Version { get; set; } = "";
        public string Title { get; set; } = "";
        public string Summary { get; set; } = "";
        public string Content { get; set; } = "";
        public string Category { get; set; } = "";
        public string Status { get; set; } = "";
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
