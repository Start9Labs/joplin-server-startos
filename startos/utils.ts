import { utils } from '@start9labs/start-sdk'

export const uiPort = 22300
export const postgresPort = 5432
export const postgresUser = 'joplin'
export const postgresDb = 'joplin'

export const generatePassword = () =>
  utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 22 })

// 32-byte (64 hex char) key for Joplin's MFA_ENCRYPTION_KEY
export const generateMfaKey = () =>
  utils.getDefaultString({ charset: 'a-f,0-9', len: 64 })
