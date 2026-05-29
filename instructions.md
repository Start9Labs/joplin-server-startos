# Joplin Server

## Documentation

- [Joplin Server documentation](https://github.com/laurent22/joplin/blob/dev/packages/server/README.md) — the upstream server README and admin guide.
- [Synchronising Joplin](https://joplinapp.org/help/apps/sync/) — how to connect the Joplin desktop, mobile, and terminal apps to a sync server.

## What you get on StartOS

Joplin Server is the sync target for your Joplin apps. Point the Joplin desktop, mobile, and terminal clients at it and your notes, notebooks, tags, and attachments stay in sync across every device — stored in a PostgreSQL database bundled inside this package, on your own server. It also serves a web admin UI for managing users, and supports publishing and sharing notes.

Both the admin UI and the client sync API are served on the same **Web UI** interface.

## Getting set up

1. Open Joplin Server from the **Dashboard** tab and start it.
2. Run the **Reset User Password** action. Leave the email as `admin@localhost` (the built-in admin) and run it — you'll get a strong password back. Joplin ships with a default `admin@localhost` / `admin` login, so do this before anything else.
3. Open the **Web UI** and sign in with `admin@localhost` and your new password. Change the admin email and finish any profile setup from the web UI.
4. In your Joplin app, go to **Configuration → Synchronisation**, choose **Joplin Server** as the sync target, and enter:
   - **URL:** the Joplin Server **Web UI** address (copy it from the interface panel)
   - **Email** and **Password:** the credentials from step 2
5. Run a sync from the app. Repeat the app configuration on each device you want to keep in sync.

## Using Joplin Server

### Web interface

The Web UI is the Joplin Server admin panel. Sign in as an admin to manage users, review shared/published notes, and adjust account settings. Individual users can enable two-factor authentication on their own accounts from here.

### Adding more users

By default, self-registration is off — create additional users yourself from the admin panel. If you'd rather let people register their own accounts, run **Enable Signups** (and **Disable Signups** to turn it back off). Anyone who can reach your URL can register while signups are enabled.

### Actions

- **Reset User Password** — generate a new password for any account by email. Use it for the initial admin setup or if anyone is locked out.
- **Configure Email (SMTP)** — add an SMTP server so Joplin Server can send account-verification, password-reset, and share-notification emails. Without it, those email features stay inactive.
- **Set Base URL** — Joplin builds share links, email links, and web UI redirects from a single base URL. It defaults to your `.local` address; set this to a custom domain or `.onion` address if you primarily reach Joplin Server there. The admin web UI works best when opened from the address the base URL is set to; client sync works from any reachable address.
- **Enable / Disable Signups** — toggle self-registration of new accounts.

## Limitations

- Joplin Server uses one base URL at a time. Client sync works from any reachable address, but the admin web UI is happiest when opened from the address **Set Base URL** points to.
