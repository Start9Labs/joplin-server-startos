# Joplin Server

## Documentation

- [Joplin Server documentation](https://github.com/laurent22/joplin/blob/dev/packages/server/README.md) — the upstream server README and admin guide.
- [Synchronising Joplin](https://github.com/laurent22/joplin/blob/dev/readme/apps/sync/index.md) — how to connect the Joplin desktop, mobile, and terminal apps to a sync server.

## What you get on StartOS

- A **Web UI** interface that serves both the admin panel and the address your Joplin apps sync to.
- A PostgreSQL database bundled inside the service, holding every user's notes and attachments, and included in backups.

## Getting set up

Follow these steps for a fresh installation. After an update or restore, use your existing Joplin credentials; you do not need to reset the admin password again.

1. Complete the **Set Base URL** task: pick the address every device will reach Joplin Server at — a public domain or `.onion` address if your phone syncs away from home. Joplin Server answers only on this address.
2. Once Joplin Server is running, complete the **Reset User Password** task. Leave the email as `admin@localhost` (the built-in admin) — you'll get the admin's password back. There is no other way to sign in as the admin until you do.
3. Open the **Web UI** and sign in with `admin@localhost` and your new password. Change the admin email and finish any profile setup from the web UI.
4. In your Joplin app, go to **Configuration → Synchronisation**, choose **Joplin Server** as the sync target, and enter:
   - **URL:** the base URL you chose in step 1
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
- **Set Base URL** — choose the one address Joplin Server answers on. The web UI and every Joplin app must use it; Joplin Server's other addresses return a "not found" error. A task asks you to choose it after install, and again if the chosen address is ever removed; until then Joplin Server uses a public domain if you have added one, otherwise your `.local` address. If you change it, update the sync URL in each Joplin app. **Open UI** opens the base URL.
- **Enable / Disable Signups** — toggle self-registration of new accounts.

## Limitations

- Joplin Server answers on one address only, the base URL. Devices can't each sync over a different address (for example LAN at home and `.onion` away); pick one every device can reach.
- Joplin Server is licensed for personal, non-commercial use only, under the [Joplin Server Personal Use License](https://github.com/laurent22/joplin/blob/dev/packages/server/LICENSE.md).
