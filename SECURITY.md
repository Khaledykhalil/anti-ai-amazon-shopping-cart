# 🛡️ Security Policy for Blurify

## Supported Versions

| Version | Supported |
| :--- | :--- |
| 1.0.x | :white_check_mark: |
| < 1.0 | :x: |

---

## Reporting a Vulnerability

We take the security of Blurify very seriously. Because Blurify runs directly within consumer browser sessions across e-commerce checkout pages, we enforce strict isolation guarantees:

- **Shadow DOM Boundary:** All Blurify UI controls run inside isolated Shadow Roots to prevent CSS pollution and DOM prototype contamination.
- **Zero Remotely Hosted Code:** Blurify does not download, evaluate, or execute any dynamic scripts from the web.
- **Minimal Permissions:** Blurify requests only the minimal permissions required for local DOM mutation and storage.

### How to Report
If you discover a security vulnerability, please do NOT create a public issue. Instead, submit a report via:
- **GitHub Security Advisories:** Go to the repository's **Security** tab and click **Report a vulnerability**.
- **Direct Email:** Contact `security@blurify.org` (or contact the maintainer at `khaled@k-circle.com`).

We will respond within 48 hours and work with you to patch the vulnerability prior to public disclosure.
