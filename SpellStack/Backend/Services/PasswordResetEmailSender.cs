using System.Net;
using System.Net.Mail;

namespace SpellStack.Api.Services;

public interface IPasswordResetEmailSender {
    Task SendResetCode(
        string recipient,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken);
}

public sealed class SmtpPasswordResetEmailSender(
    IConfiguration configuration) : IPasswordResetEmailSender {
    public async Task SendResetCode(
        string recipient,
        string code,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken) {
        var host = configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host)) {
            throw new InvalidOperationException("SMTP is not configured.");
        }

        var port = int.TryParse(configuration["Smtp:Port"], out var parsedPort)
            ? parsedPort
            : 587;
        var username = configuration["Smtp:Username"];
        var password = configuration["Smtp:Password"];
        var from = configuration["Smtp:From"] ?? username;
        if (string.IsNullOrWhiteSpace(from)) {
            throw new InvalidOperationException("Smtp:From is not configured.");
        }

        using var client = new SmtpClient(host, port) {
            EnableSsl = !bool.TryParse(
                configuration["Smtp:EnableSsl"],
                out var enableSsl) || enableSsl
        };
        if (!string.IsNullOrWhiteSpace(username) &&
            !string.IsNullOrWhiteSpace(password)) {
            client.Credentials = new NetworkCredential(username, password);
        }

        using var message = new MailMessage {
            From = new MailAddress(from),
            Subject = "Your SpellStack password reset code",
            Body = $"""
                SpellStack password reset

                Your verification code is: {code}

                This code expires at {expiresAtUtc:HH:mm} UTC.
                If you did not request a password reset, you can ignore this email.
                """
        };
        message.To.Add(recipient);

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }
}
