using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SpellStack.Api.Services;

namespace SpellStack.Api.Controllers {
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class TranslationController : ControllerBase {
        private readonly DeepLTranslationService translationService;

        public TranslationController(DeepLTranslationService translationService) {
            this.translationService = translationService;
        }

        [HttpPost("suggestions")]
        public async Task<IActionResult> GetSuggestions(
            [FromBody] TranslationSuggestionsRequest request,
            CancellationToken cancellationToken) {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

            try {
                var suggestions = await translationService.GetSuggestions(
                    userId,
                    request.Text ?? "",
                    request.SourceLanguage ?? "",
                    request.TargetLanguage ?? "",
                    cancellationToken);
                return Ok(new { suggestions });
            } catch (TranslationServiceException exception) {
                var statusCode = exception.Code switch {
                    "invalid_request" => StatusCodes.Status400BadRequest,
                    "unsupported_language_pair" => StatusCodes.Status400BadRequest,
                    "not_configured" => StatusCodes.Status503ServiceUnavailable,
                    "rate_limited" => StatusCodes.Status429TooManyRequests,
                    _ => StatusCodes.Status503ServiceUnavailable
                };
                return StatusCode(statusCode, new { exception.Code, exception.Message });
            }
        }
    }

    public record TranslationSuggestionsRequest(string? Text, string? SourceLanguage, string? TargetLanguage);
}
