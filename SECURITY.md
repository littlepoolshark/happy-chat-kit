# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Here are the versions that are
currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within HappyChatKit, please send an
email to liu1145694956@gmail.com. Please do **not** create a public GitHub issue for
security vulnerabilities.

We will acknowledge receipt of your vulnerability report as soon as possible,
and we'll send a more detailed response indicating the next steps in handling
your report. After the initial reply, we will endeavor to keep you informed of
the progress towards a fix and full announcement.

## Security Best Practices

When using HappyChatKit in your applications:

1. **Keep dependencies up to date**: Regularly update to the latest version of
   HappyChatKit and its dependencies.
2. **Sanitize user input**: Always validate and sanitize user inputs before
   processing or rendering.
3. **Use HTTPS**: When connecting to chat backends, always use HTTPS to encrypt
   data in transit.
4. **Content Security Policy**: Implement a CSP to prevent XSS attacks when
   rendering markdown content.

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine the affected versions.
2. Audit code to find any potential similar problems.
3. Prepare fixes for all still-supported versions and release them as quickly as
   possible.

## Comments on this Policy

If you have suggestions on how this process could be improved, please submit a
pull request or open an issue to discuss.
