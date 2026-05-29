import { FileHelper, smtpShape, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.object({
  postgresPassword: z.string().optional().catch(undefined),
  mfaEncryptionKey: z.string().optional().catch(undefined),
  appBaseUrl: z.string().optional().catch(undefined),
  signupEnabled: z.boolean().catch(false),
  smtp: smtpShape,
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'store.json' },
  shape,
)
