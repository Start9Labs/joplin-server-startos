<p align="center">
  <img src="icon.svg" alt="Joplin Server Logo" width="21%">
</p>

# Joplin Server on StartOS

> Everything not listed in this document should behave the same as upstream
> Joplin Server. If a feature, setting, or behavior is not mentioned here,
> the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[Joplin Server](https://github.com/laurent22/joplin/tree/dev/packages/server) is the sync server for the Joplin note-taking apps. This package bundles it with its own PostgreSQL database.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Two upstream images run unmodified, each in its own subcontainer; Joplin Server starts only once PostgreSQL reports ready.

| Property      | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Images        | `joplin/server` and `postgres`, both upstream unmodified                                          |
| Architectures | x86_64, aarch64                                                                                   |
| Entrypoints   | Upstream for both; PostgreSQL gets `-c listen_addresses=127.0.0.1`                                |
| Subcontainers | `postgres-sub` — the database, reachable only on localhost; `joplin-sub` — Joplin Server on 22300 |

---

## Volume and Data Layout

Notes and attachments live in PostgreSQL, since Joplin's default `STORAGE_DRIVER=Database` is kept; the second volume holds only the package's own settings.

| Volume | Mount Point                            | Contents                                                     |
| ------ | -------------------------------------- | ------------------------------------------------------------ |
| `db`   | `/var/lib/postgresql` (`postgres-sub`) | PostgreSQL data directory: users, notes, attachments, shares |
| `main` | Not mounted                            | `store.json`                                                 |

---

## File Models

The package writes no Joplin configuration file. It keeps its settings in `store.json` and passes them to both containers as environment variables on every launch; everything else — users, sharing, per-user two-factor authentication — lives in Joplin's database and its web UI.

`store.json` (JSON, root of `main`):

| Key                | Seeded                        | Rewritten by               | Delivered as                           |
| ------------------ | ----------------------------- | -------------------------- | -------------------------------------- |
| `postgresPassword` | Random at install             | Nothing                    | `POSTGRES_PASSWORD` to both containers |
| `mfaEncryptionKey` | Random 32-byte hex at install | Nothing                    | `MFA_ENCRYPTION_KEY`                   |
| `signupEnabled`    | `false`                       | **Enable/Disable Signups** | `SIGNUP_ENABLED`                       |
| `appBaseUrl`       | Unset                         | **Set Base URL**           | `APP_BASE_URL`                         |
| `smtp`             | Disabled                      | **Configure Email (SMTP)** | `MAILER_*`                             |

Any change to `store.json` restarts the service with the new values. Never change `postgresPassword` or `mfaEncryptionKey` by hand: PostgreSQL keeps the password it was initialized with, and the key decrypts users' stored two-factor secrets.

`APP_BASE_URL` is `appBaseUrl` followed to its hostname's current port and scheme (`sdk.setupPrimaryUrl`). While `appBaseUrl` is unset or its hostname is no longer one of the Web UI interface's addresses, it is the interface's preferred address instead — a public domain (HTTPS first), else the `.local` address, else the first — and the stored choice is kept for when its hostname returns.

The package also sets, on every launch: `DB_CLIENT=pg` and `POSTGRES_HOST=127.0.0.1` (the bundled database), `MFA_ENABLED=1` (two-factor available, opt-in per user), `MAX_TIME_DRIFT=0` (skips upstream's NTP check, which needs outbound NTP), and `RUNNING_IN_DOCKER=false` (the image's default rewrites a localhost database host to `host.docker.internal`).

---

## Dependencies

None. PostgreSQL is bundled.

---

## Network Access and Interfaces

One interface serves both the admin web UI and the sync API the Joplin apps connect to.

| Interface | Type | Port  | Protocol | Purpose                              |
| --------- | ---- | ----- | -------- | ------------------------------------ |
| `ui`      | ui   | 22300 | HTTP     | Admin/web UI and the client sync API |

Joplin builds absolute links (share links, emails, web UI redirects) from the single `APP_BASE_URL`. Client sync works from any reachable address; the web UI works best opened from the base URL, so the interface nominates it (`preferredLauncherAddress`) and **Open UI** opens it.

---

## Installation and First-Run Flow

Install generates the database password and the two-factor encryption key, and raises tasks to replace upstream's default admin login and to choose the base URL. PostgreSQL initializes its database on first start, and Joplin runs its own schema migrations on every start.

Joplin creates a default admin, `admin@localhost` / `admin`, on first start. The package does not change it; the **Reset User Password** task prompts the user to.

---

## Actions

Four actions, all of which change one `store.json` key or one database row.

**Reset User Password** — when the default admin login is still in place, or any user is locked out. Upstream has no password-reset command, so this generates a 24-character password and writes its bcrypt hash straight into the `users` table for the given email (default `admin@localhost`). Needs the database running; fails if no user has that email. Each run replaces the previous password. Outputs the email and new password.

**Configure Email (SMTP)** — when users need verification, password-reset or share emails; without it those features are inactive. Uses the system SMTP server or a custom one. Restarts the service.

**Set Base URL** — at install, and when users should reach the server mainly at another of its addresses, such as a public domain or `.onion`. Picks one of the Web UI interface's addresses (the form preselects the preferred one); it becomes `APP_BASE_URL` and the address Open UI opens. Restarts the service.

**Enable/Disable Signups** — shown as **Enable Signups** or **Disable Signups** depending on the current state. While enabled, anyone who can reach the server can register. Both directions ask for confirmation before running, naming what changes. Restarts the service.

---

## Tasks

Two tasks.

| Task                    | Severity  | Raised when                                                                       | Cleared by                                                      |
| ----------------------- | --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Reset User Password** | important | A fresh install                                                                   | Running the action. Does not return.                            |
| **Set Base URL**        | important | No base URL is chosen, or its hostname is no longer one of the Web UI's addresses | Choosing one of the addresses, or the chosen hostname returning |

Updates and restores do not raise Reset User Password. Set Base URL comes from `primaryUrl.setupTask` and re-runs when the interface's addresses change; a port change alone does not raise it. While it is open the service runs on the preferred address. The service is never held on a critical task.

---

## Health Checks

Two checks gate startup; only one is shown.

| Check         | Probes                               | Grace period |
| ------------- | ------------------------------------ | ------------ |
| Database      | `pg_isready` on `127.0.0.1` (hidden) | Default      |
| Web Interface | Port 22300 listening                 | 60s          |

**Database** stuck waiting means PostgreSQL did not come up, and Joplin Server will not start; check the logs for a data-directory or password error. **Web Interface** failing past its grace period with the database ready means Joplin Server itself failed to start; check the logs.

---

## Backups and Restore

The database is dumped with `pg_dump` and the `main` volume is copied. The `db` volume's files are never backed up: restore initializes a fresh PostgreSQL and replays the dump into it, then restores `store.json`, so the database password and two-factor key match. Nothing needs re-entering after a restore.

---

## Limitations and Differences

1. **Personal, non-commercial use only.** Joplin Server is under the Joplin Server Personal Use License.
2. **One base URL.** Links and redirects use `APP_BASE_URL` only.
3. **No transcription service.** The optional `joplin/transcribe` companion for handwriting OCR is not included.
4. **No clock-drift check.** `MAX_TIME_DRIFT=0`; the server clock is not verified against NTP.

---

## Quick Reference for AI Consumers

```yaml
package_id: joplin-server
image: [joplin/server, postgres]
architectures: [x86_64, aarch64]
subcontainers: [postgres-sub, joplin-sub]
volumes:
  db: /var/lib/postgresql
  main: not mounted
file_models:
  - store.json
startos_managed_env_vars:
  - APP_PORT
  - APP_BASE_URL
  - DB_CLIENT
  - POSTGRES_HOST
  - POSTGRES_PORT
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_DATABASE
  - POSTGRES_DB
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
dependencies: none
interfaces:
  ui: { type: ui, port: 22300 }
actions:
  - reset-password
  - manage-smtp
  - set-base-url
  - toggle-signups
tasks:
  - { action: reset-password, severity: important }
  - { action: set-base-url, severity: important }
health_checks:
  - postgres
  - joplin
```
