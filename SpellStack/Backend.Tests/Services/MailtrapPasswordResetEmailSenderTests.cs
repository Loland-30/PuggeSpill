using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SpellStack.Api.Services;
using Xunit;

namespace SpellStack.Api.Tests.Services;

public class MailtrapPasswordResetEmailSenderTests {
    [Fact]
    public async Task SendResetCodePostsExpectedMailtrapRequest() {
        var handler = new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.Accepted)));
        var sender = CreateSender(handler);
        var expiresAt = new DateTime(2026, 7, 26, 14, 30, 0, DateTimeKind.Utc);

        await sender.SendResetCode(
            "user@example.com",
            "123456",
            expiresAt,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal("https://send.api.mailtrap.io/api/send", handler.RequestUri);
        Assert.Equal("Bearer", handler.AuthorizationScheme);
        Assert.Equal("test-api-token", handler.AuthorizationParameter);

        using var document = JsonDocument.Parse(handler.Body!);
        var root = document.RootElement;
        Assert.Equal("no-reply@spellstack.test", root.GetProperty("from").GetProperty("email").GetString());
        Assert.Equal("SpellStack", root.GetProperty("from").GetProperty("name").GetString());
        Assert.Equal("user@example.com", root.GetProperty("to")[0].GetProperty("email").GetString());
        Assert.Equal("Your SpellStack password reset code", root.GetProperty("subject").GetString());
        Assert.Contains("123456", root.GetProperty("text").GetString());
        Assert.Contains("<strong>123456</strong>", root.GetProperty("html").GetString());
        Assert.Contains("14:30 UTC", root.GetProperty("text").GetString());
    }

    [Theory]
    [InlineData(HttpStatusCode.OK)]
    [InlineData(HttpStatusCode.Accepted)]
    [InlineData(HttpStatusCode.NoContent)]
    public async Task SendResetCodeAcceptsAnySuccessStatus(HttpStatusCode statusCode) {
        var sender = CreateSender(new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(statusCode))));

        await sender.SendResetCode(
            "user@example.com",
            "123456",
            DateTime.UtcNow.AddMinutes(15),
            TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task SendResetCodeThrowsSafeExceptionForProviderFailure() {
        var sender = CreateSender(new RecordingHandler(
            (_, _) => Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest) {
                Content = new StringContent("""{"errors":["provider rejected 123456"]}""")
            })));

        var exception = await Assert.ThrowsAsync<HttpRequestException>(() =>
            sender.SendResetCode(
                "user@example.com",
                "123456",
                DateTime.UtcNow.AddMinutes(15),
                TestContext.Current.CancellationToken));

        Assert.Equal(HttpStatusCode.BadRequest, exception.StatusCode);
        Assert.DoesNotContain("123456", exception.Message);
        Assert.DoesNotContain("provider rejected", exception.Message);
    }

    [Fact]
    public async Task SendResetCodePassesCancellationToHttpRequest() {
        var sender = CreateSender(new RecordingHandler(
            async (_, cancellationToken) => {
                await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
                return new HttpResponseMessage(HttpStatusCode.OK);
            }));
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            sender.SendResetCode(
                "user@example.com",
                "123456",
                DateTime.UtcNow.AddMinutes(15),
                cancellation.Token));
    }

    [Theory]
    [InlineData("", "https://send.api.mailtrap.io/api/send", "no-reply@example.com", "SpellStack")]
    [InlineData("token", "http://send.api.mailtrap.io/api/send", "no-reply@example.com", "SpellStack")]
    [InlineData("token", "https://send.api.mailtrap.io/api/send", "", "SpellStack")]
    [InlineData("token", "https://send.api.mailtrap.io/api/send", "no-reply@example.com", "")]
    public void ValidateRejectsMissingOrUnsafeConfiguration(
        string apiToken,
        string endpoint,
        string fromEmail,
        string fromName) {
        var options = new MailtrapOptions {
            ApiToken = apiToken,
            Endpoint = endpoint,
            FromEmail = fromEmail,
            FromName = fromName
        };

        Assert.Throws<InvalidOperationException>(options.Validate);
    }

    private static MailtrapPasswordResetEmailSender CreateSender(
        HttpMessageHandler handler) {
        var client = new HttpClient(handler) {
            Timeout = TimeSpan.FromSeconds(12)
        };
        var factory = new StubHttpClientFactory(client);
        return new MailtrapPasswordResetEmailSender(
            factory,
            Options.Create(new MailtrapOptions {
                ApiToken = "test-api-token",
                Endpoint = "https://send.api.mailtrap.io/api/send",
                FromEmail = "no-reply@spellstack.test",
                FromName = "SpellStack"
            }),
            NullLogger<MailtrapPasswordResetEmailSender>.Instance);
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory {
        public HttpClient CreateClient(string name) {
            Assert.Equal(MailtrapPasswordResetEmailSender.HttpClientName, name);
            return client;
        }
    }

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> responseFactory)
        : HttpMessageHandler {
        public HttpMethod? Method { get; private set; }
        public string? RequestUri { get; private set; }
        public string? AuthorizationScheme { get; private set; }
        public string? AuthorizationParameter { get; private set; }
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) {
            Method = request.Method;
            RequestUri = request.RequestUri?.ToString();
            AuthorizationScheme = request.Headers.Authorization?.Scheme;
            AuthorizationParameter = request.Headers.Authorization?.Parameter;
            Body = request.Content == null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return await responseFactory(request, cancellationToken);
        }
    }
}
