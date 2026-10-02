import bcrypt from 'bcryptjs'
import { Client } from 'pg'
import { utils } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'
import { postgresDb, postgresPort, postgresUser } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'The email address of the account to reset. The default admin account is admin@localhost.',
    ),
    required: true,
    default: 'admin@localhost',
  }),
})

export const resetPassword = sdk.Action.withInput(
  'reset-password',

  async () => ({
    name: i18n('Reset User Password'),
    description: i18n(
      'Generate a new random password for a Joplin Server user account and set it directly in the database.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => ({ email: 'admin@localhost' }),

  async ({ input }) => {
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 24 })
    const hash = await bcrypt.hash(password, 10)

    const pgPassword =
      (await storeJson.read((s) => s.postgresPassword).once()) || ''

    const client = new Client({
      host: '127.0.0.1',
      port: postgresPort,
      user: postgresUser,
      password: pgPassword,
      database: postgresDb,
    })

    try {
      await client.connect()
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [input.email],
      )
      if (existing.rows.length === 0) {
        throw new Error(
          `No Joplin Server user found with email "${input.email}"`,
        )
      }
      await client.query(
        'UPDATE users SET password = $1, updated_time = $2 WHERE email = $3',
        [hash, Date.now(), input.email],
      )
    } finally {
      await client.end()
    }

    return {
      version: '1',
      title: i18n('New Login Credentials'),
      message: i18n(
        'The password has been reset. Sign in with these credentials, then change it from within Joplin Server.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Email'),
            description: null,
            value: input.email,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
