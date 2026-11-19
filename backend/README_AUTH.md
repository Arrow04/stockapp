# Authentication & 2FA

Real authentication is enabled for StockApp.

## Default admin account
- Email: `admin@stockapp.com`
- Password: `admin123`
- Role: admin

Change the password after first login (or update the seed in `auth.py`).

## What's implemented
- **bcrypt** password hashing (never stored in plaintext)
- **JWT** access tokens (30 min) + refresh tokens (7 days)
- **TOTP 2FA** via `pyotp` with QR code (Google Authenticator / any TOTP app)
- Protected `/api/auth/me`, `/2fa/*`, `/users` (admin-only)
- Registration, login, logout, per-user portfolios

## API endpoints (`/api/auth`)
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/register` | POST | no | Create account, returns JWT |
| `/login` | POST | no | Login; returns `requires_2fa` if enabled |
| `/me` | GET | Bearer | Current user |
| `/2fa/setup` | POST | Bearer | QR code + secret |
| `/2fa/enable` | POST | Bearer | Verify code, enable 2FA, get backup codes |
| `/2fa/disable` | POST | Bearer | Disable with password |
| `/users` | GET | Bearer (admin) | List all users |

## Frontend flow
- Login page: `D:\stockapp\frontend\src\app\page.tsx` (Sign In / Sign Up / 2FA code)
- Auth client: `src/lib/auth.ts`, hook: `src/hooks/useAuth.tsx`
- Protected pages call `useRequireAuth()`
- 2FA settings UI: `src/components/TwoFASettings.tsx` (Settings → Security)

## Security notes for production
- Change `JWT_SECRET` in `auth.py` (or set `JWT_SECRET` env var)
- Use PostgreSQL instead of SQLite for multi-instance deployment
- Store JWT in httpOnly cookies (currently localStorage) for XSS protection
- Add rate limiting on `/login`
- HTTPS only in production
