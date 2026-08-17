<p align="center">
  <img src="icon.svg" alt="Joplin Server Logo" width="21%">
</p>

# Joplin Server on StartOS

> **Upstream docs:** <https://github.com/laurent22/joplin/blob/dev/packages/server/README.md>
>
> Everything not listed in this document should behave the same as upstream
> Joplin Server. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable.

[Joplin Server](https://github.com/laurent22/joplin/tree/dev/packages/server) is the official synchronisation server for the [Joplin](https://joplinapp.org/) note-taking app. It lets the Joplin desktop, mobile, and terminal clients sync notes, notebooks, tags, and attachments through your own server, and lets users publish and share notes.

This package bundles Joplin Server with its own PostgreSQL database so all data stays on your StartOS device.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| App image     | `joplin/server` (upstream, unmodified)                           |
| Database image| `postgres` (upstream, unmodified)                                |
| Architectures | x86_64, aarch64                                                  |
| App command   | Upstream entrypoint (`tini -- yarn start-prod`)                  |
| DB command    | Upstream entrypoint with `listen_addresses=127.0.0.1`            |

Two daemons run in the package: `postgres` (internal) and `joplin` (the app). The app daemon `requires` the database, so PostgreSQL is confirmed ready before Joplin Server starts.

---

## Volume and Data Layout

| Volume | Mount Point             | Purpose                                                   |
| ------ | ----------------------- | --------------------------------------------------------- |
| `db`   | `/var/lib/postgresql`   | PostgreSQL data directory (all notes and attachments)     |
| `main` | n/a (read via SDK)      | `store.json` — generated DB password, MFA key, and settings |

Joplin Server is configured with the default `STORAGE_DRIVER=Database`, so all note content and attachments live inside PostgreSQL rather than on a separate file volume.

---

## Installation and First-Run Flow

- A random PostgreSQL password and a 32-byte `MFA_ENCRYPTION_KEY` are generated on install and stored in `store.json`.
- The PostgreSQL database is created automatically by the upstream `postgres` entrypoint on first start.
- Joplin Server runs its own database migrations on startup (`DB_AUTO_MIGRATION` is on by default upstream).
- Joplin Server creates a default admin account (`admin@localhost` / `admin`). An **important task** is surfaced after install prompting you to set a strong password via the **Reset User Password** action.

---

## Configuration Management

| StartOS-Managed (via actions / env vars)                                   | Upstream-Managed (Joplin Server web UI)                  |
| -------------------------------------------------------------------------- | -------------------------------------------------------- |
| `APP_BASE_URL` (auto-derived or set via **Set Base URL**)                  | User accounts, admin panel, sharing, publishing          |
| `SIGNUP_ENABLED` (via **Enable/Disable Signups**)                          | Per-user two-factor authentication                       |
| Mailer (`MAILER_*`) via **Configure Email (SMTP)**                         | Notebooks, notes, tags, attachments                      |
| `DB_CLIENT`, `POSTGRES_*` (point Joplin at the bundled database)           |                                                          |
| `MFA_ENABLED=1`, `MFA_ENCRYPTION_KEY` (2FA available, opt-in per user)     |                                                          |
| `MAX_TIME_DRIFT=0` (skip the upstream NTP check; StartOS may lack outbound NTP) |                                                     |
| `RUNNING_IN_DOCKER=false` (the image defaults it on, which would misroute the DB host) |                                          |

`APP_BASE_URL` defaults to the package's `.local` LAN address. Joplin generates absolute links (share URLs, emails, web UI redirects) from this value, so the web UI works best when accessed from the address it is set to. Use **Set Base URL** to point it at a custom domain or `.onion` address.

---

## Network Access and Interfaces

| Interface | Port  | Protocol | Purpose                                            |
| --------- | ----- | -------- | -------------------------------------------------- |
| Web UI    | 22300 | HTTP     | Joplin Server admin/web UI and the client sync API |

The same interface serves both the browser admin UI and the sync/share API that Joplin clients connect to. StartOS terminates TLS at the edge, so clients connect over `https`.

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

---

## Actions (StartOS UI)

| Action                  | Purpose                                                                                  | Visibility | Availability  | Inputs                          | Outputs                          |
| ----------------------- | ---------------------------------------------------------------------------------------- | ---------- | ------------- | ------------------------------- | -------------------------------- |
| Reset User Password     | Generates a new random password for a user and writes the bcrypt hash directly to the DB | Enabled    | Only running  | Email (default `admin@localhost`) | New email + password (masked)  |
| Configure Email (SMTP)  | Configures `MAILER_*` so Joplin can send verification, password-reset, and share emails  | Enabled    | Any           | SMTP selection (disabled/system/custom) | —                        |
| Set Base URL            | Overrides `APP_BASE_URL`; leave blank to auto-derive from the StartOS interface          | Enabled    | Any           | Base URL (optional)             | —                                |
| Enable/Disable Signups  | Toggles `SIGNUP_ENABLED` so users can (or cannot) self-register accounts                 | Enabled    | Any           | —                               | —                                |

**Reset User Password** requires the service to be running because it connects to the live PostgreSQL database. It targets a user by email, so it works for any account, not just the default admin.

---

## Backups and Restore

**Included in backup:**

- PostgreSQL database via `pg_dump` (all notes, notebooks, tags, attachments, users)
- `main` volume (`store.json`: generated DB password, MFA key, settings)

**Restore behavior:** The database dump is restored and `store.json` is replaced before the service starts.

---

## Health Checks

| Check         | Method                                  | Notes                                                    |
| ------------- | --------------------------------------- | -------------------------------------------------------- |
| Database      | `pg_isready` on `127.0.0.1`             | Internal (`display: null`) — gates the `joplin` daemon   |
| Web Interface | Port listening (22300), 60s grace       | "Joplin Server is ready" / "Joplin Server is not ready"  |

A localhost `/api/ping` check is intentionally not used: Joplin validates the request `Host` against `APP_BASE_URL` and would reject (and log) every probe from `127.0.0.1`.

---

## Dependencies

None. PostgreSQL is bundled inside the package as an internal daemon.

---

## Limitations and Differences

1. **Single `APP_BASE_URL`.** Joplin supports only one public base URL at a time. The admin web UI works best when accessed from the address `APP_BASE_URL` is set to; client sync works from any reachable address regardless. Use **Set Base URL** to change it.
2. **No built-in password CLI upstream.** Joplin Server has no user-management command, so **Reset User Password** sets the bcrypt hash directly in the database.
3. **Transcribe / handwriting OCR service not included.** The optional `joplin/transcribe` companion service (16 GB RAM / 4 CPU upstream recommendation) is intentionally omitted.
4. **NTP drift check disabled.** `MAX_TIME_DRIFT=0` because a StartOS device may not have outbound NTP access; keep your server clock accurate by other means.

---

## What Is Unchanged from Upstream

- Note/notebook/tag/attachment synchronisation and the client sync API
- The admin web UI and per-user settings, including opt-in two-factor authentication
- Note publishing and sharing between users
- Database schema and migrations (run automatically on startup)

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: joplin-server
images:
  - joplin/server
  - postgres
architectures: [x86_64, aarch64]
volumes:
  db: /var/lib/postgresql
  main: store.json (read via SDK)
ports:
  ui: 22300
dependencies: none
startos_managed_env_vars:
  - APP_PORT
  - APP_BASE_URL
  - DB_CLIENT
  - POSTGRES_HOST
  - POSTGRES_PORT
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_DATABASE
  - SIGNUP_ENABLED
  - MFA_ENABLED
  - MFA_ENCRYPTION_KEY
  - MAX_TIME_DRIFT
  - RUNNING_IN_DOCKER
  - MAILER_ENABLED
  - MAILER_HOST
  - MAILER_PORT
  - MAILER_SECURITY
  - MAILER_AUTH_USER
  - MAILER_AUTH_PASSWORD
  - MAILER_NOREPLY_NAME
  - MAILER_NOREPLY_EMAIL
actions:
  - reset-password
  - manage-smtp
  - set-base-url
  - toggle-signups
```
