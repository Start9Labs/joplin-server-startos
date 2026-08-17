import { T } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { postgresDb, postgresPort, postgresUser, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Joplin Server!'))

  const postgresPassword =
    (await storeJson.read((s) => s.postgresPassword).const(effects)) ?? ''
  const mfaEncryptionKey =
    (await storeJson.read((s) => s.mfaEncryptionKey).const(effects)) ?? ''
  const signupEnabled =
    (await storeJson.read((s) => s.signupEnabled).const(effects)) ?? false
  const baseUrlOverride =
    (await storeJson.read((s) => s.appBaseUrl).const(effects)) ?? ''
  const smtpSelection = await storeJson.read((s) => s.smtp).const(effects)

  // Joplin builds absolute links from APP_BASE_URL, so it must resolve to a reachable address; prefer the LAN .local address.
  const derivedBaseUrl =
    (await sdk.serviceInterface
      .getOwn(effects, 'ui', (u) => {
        const ai = u?.addressInfo
        if (!ai) return ''
        return (
          ai.filter({ kind: 'mdns' }).format('urlstring')[0] ??
          ai.filter({ kind: 'domain' }).format('urlstring')[0] ??
          ai.nonLocal.format('urlstring')[0] ??
          ''
        )
      })
      .const()) ?? ''
  const appBaseUrl = baseUrlOverride || derivedBaseUrl

  let smtpCredentials: T.SmtpValue | null = null
  if (smtpSelection?.selection === 'system') {
    smtpCredentials = await sdk.getSystemSmtp(effects).const()
    if (smtpCredentials && smtpSelection.value.customFrom) {
      smtpCredentials.from = smtpSelection.value.customFrom
    }
  } else if (smtpSelection?.selection === 'custom') {
    const { host, from, username, password, security } =
      smtpSelection.value.provider.value
    smtpCredentials = {
      host,
      port: Number(security.value.port),
      from,
      username,
      password: password ?? null,
      security: security.selection,
    }
  }

  const mailerEnv: Record<string, string> = smtpCredentials
    ? {
        MAILER_ENABLED: 'true',
        MAILER_HOST: smtpCredentials.host,
        MAILER_PORT: String(smtpCredentials.port),
        MAILER_SECURITY:
          smtpCredentials.security === 'tls' ? 'tls' : 'starttls',
        MAILER_AUTH_USER: smtpCredentials.username,
        MAILER_AUTH_PASSWORD: smtpCredentials.password ?? '',
        MAILER_NOREPLY_NAME: 'Joplin Server',
        MAILER_NOREPLY_EMAIL: smtpCredentials.from,
      }
    : { MAILER_ENABLED: 'false' }

  const postgresSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'postgres' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'db',
      subpath: null,
      mountpoint: '/var/lib/postgresql',
      readonly: false,
    }),
    'postgres-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('postgres', {
      subcontainer: postgresSub,
      exec: {
        command: sdk.useEntrypoint(['-c', 'listen_addresses=127.0.0.1']),
        env: {
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DB: postgresDb,
        },
      },
      ready: {
        display: null,
        fn: async () => {
          const { exitCode } = await postgresSub.exec([
            'pg_isready',
            '-U',
            postgresUser,
            '-d',
            postgresDb,
            '-h',
            '127.0.0.1',
          ])
          return exitCode !== 0
            ? {
                result: 'loading',
                message: i18n('Waiting for PostgreSQL to be ready'),
              }
            : { result: 'success', message: i18n('PostgreSQL is ready') }
        },
      },
      requires: [],
    })
    .addDaemon('joplin', {
      subcontainer: await sdk.SubContainer.of(
        effects,
        { imageId: 'joplin-server' },
        sdk.Mounts.of(),
        'joplin-sub',
      ),
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          APP_PORT: String(uiPort),
          APP_BASE_URL: appBaseUrl,
          DB_CLIENT: 'pg',
          POSTGRES_HOST: '127.0.0.1',
          POSTGRES_PORT: String(postgresPort),
          POSTGRES_USER: postgresUser,
          POSTGRES_PASSWORD: postgresPassword,
          POSTGRES_DATABASE: postgresDb,
          SIGNUP_ENABLED: signupEnabled ? 'true' : 'false',
          MFA_ENABLED: '1',
          MFA_ENCRYPTION_KEY: mfaEncryptionKey,
          MAX_TIME_DRIFT: '0',
          // The image sets RUNNING_IN_DOCKER=1, which rewrites a localhost POSTGRES_HOST to host.docker.internal; our DB shares localhost, so force it off.
          RUNNING_IN_DOCKER: 'false',
          ...mailerEnv,
        },
      },
      ready: {
        display: i18n('Web Interface'),
        gracePeriod: 60000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('Joplin Server is ready'),
            errorMessage: i18n('Joplin Server is not ready'),
          }),
      },
      requires: ['postgres'],
    })
})
