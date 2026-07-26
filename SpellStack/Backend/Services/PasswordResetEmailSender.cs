using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace SpellStack.Api.Services;

public interface IPasswordResetEmailSender {
    Task SendResetCode(
        string recipient,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken);
}

public sealed class MailtrapOptions {
    public const string SectionName = "Mailtrap";

    public string ApiToken { get; set; } = "";
    public string Endpoint { get; set; } = "";
    public string FromEmail { get; set; } = "";
    public string FromName { get; set; } = "";

    public Uri Validate() {
        if (string.IsNullOrWhiteSpace(ApiToken)) {
            throw new InvalidOperationException("Mailtrap:ApiToken must be configured.");
        }
        if (!Uri.TryCreate(Endpoint, UriKind.Absolute, out var endpoint) ||
            endpoint.Scheme != Uri.UriSchemeHttps) {
            throw new InvalidOperationException(
                "Mailtrap:Endpoint must be a valid HTTPS URL.");
        }
        if (string.IsNullOrWhiteSpace(FromEmail) || !FromEmail.Contains('@')) {
            throw new InvalidOperationException(
                "Mailtrap:FromEmail must be configured with a valid sender address.");
        }
        if (string.IsNullOrWhiteSpace(FromName)) {
            throw new InvalidOperationException("Mailtrap:FromName must be configured.");
        }

        return endpoint;
    }
}

public sealed class MailtrapPasswordResetEmailSender(
    IHttpClientFactory httpClientFactory,
    IOptions<MailtrapOptions> options,
    ILogger<MailtrapPasswordResetEmailSender> logger) : IPasswordResetEmailSender {
    public const string HttpClientName = "MailtrapPasswordReset";

    private readonly MailtrapOptions mailtrapOptions = options.Value;

    public async Task SendResetCode(
        string recipient,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken) {
        var endpoint = mailtrapOptions.Validate();
        var client = httpClientFactory.CreateClient(HttpClientName);
        var encodedCode = WebUtility.HtmlEncode(code);
        var expiry = expiresAtUtc.ToUniversalTime().ToString("HH:mm 'UTC'");
        var payload = new MailtrapSendRequest(
            new MailtrapAddress(
                mailtrapOptions.FromEmail.Trim(),
                mailtrapOptions.FromName.Trim()),
            [new MailtrapRecipient(recipient.Trim())],
            "Your SpellStack password reset code",
            $"""
                SpellStack password reset

                Your verification code is: {code}

                This code expires at {expiry}.
                If you did not request a password reset, you can ignore this email.
                """,
            $"""
                <h1>SpellStack password reset</h1>
                <p>Your verification code is: <strong>{encodedCode}</strong></p>
                <p>This code expires at {expiry}.</p>
                <p>If you did not request a password reset, you can ignore this email.</p>
                """);

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint) {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", mailtrapOptions.ApiToken.Trim());

        using var response = await client.SendAsync(
            request,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);
        if (response.IsSuccessStatusCode) return;

        logger.LogWarning(
            "Mailtrap password reset delivery failed with status {StatusCode} ({ReasonPhrase}).",
            (int)response.StatusCode,
            response.ReasonPhrase);
        throw new HttpRequestException(
            $"Mailtrap password reset delivery failed with status {(int)response.StatusCode}.",
            null,
            response.StatusCode);
    }

    private sealed record MailtrapSendRequest(
        [property: JsonPropertyName("from")] MailtrapAddress From,
        [property: JsonPropertyName("to")] IReadOnlyList<MailtrapRecipient> To,
        [property: JsonPropertyName("subject")] string Subject,
        [property: JsonPropertyName("text")] string Text,
        [property: JsonPropertyName("html")] string Html);

    private sealed record MailtrapAddress(
        [property: JsonPropertyName("email")] string Email,
        [property: JsonPropertyName("name")] string Name);

    private sealed record MailtrapRecipient(
        [property: JsonPropertyName("email")] string Email);
}
