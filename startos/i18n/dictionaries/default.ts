export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Joplin Server!': 0,
  'Waiting for PostgreSQL to be ready': 1,
  'PostgreSQL is ready': 2,
  'Web Interface': 3,
  'Joplin Server is ready': 4,
  'Joplin Server is not ready': 5,

  // interfaces.ts
  'Web UI': 6,
  'The Joplin Server web interface': 7,

  // actions/resetPassword.ts
  'Reset User Password': 8,
  'Generate a new random password for a Joplin Server user account and set it directly in the database.': 9,
  Email: 10,
  'The email address of the account to reset. The default admin account is admin@localhost.': 11,
  'New Login Credentials': 12,
  'The password has been reset. Sign in with these credentials, then change it from within Joplin Server.': 13,
  Password: 14,

  // actions/manageSmtp.ts
  'Configure Email (SMTP)': 15,
  'Set up an SMTP server so Joplin Server can send emails for account verification, password resets, and share notifications.': 16,

  // actions/setBaseUrl.ts
  'Base URL': 17,
  'A full URL including scheme, e.g. https://notes.example.com. Leave blank to auto-detect from your StartOS interface.': 18,
  'Set Base URL': 19,
  'Override the public base URL Joplin Server uses to generate links (share links, emails, and web UI redirects). Leave blank to use your StartOS address automatically.': 20,

  // actions/toggleSignups.ts
  'Enable Signups': 21,
  'Disable Signups': 22,
  'Signups are currently enabled. Run this action to disable new account registration.': 23,
  'Signups are currently disabled. Run this action to allow new users to register their own accounts.': 24,
  'Anyone with access to your Joplin Server URL will be able to create an account.': 25,

  // init/initializeService.ts
  'Joplin Server ships with default admin credentials (admin@localhost / admin). Set a strong password from the "Reset User Password" action right away.': 26,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
