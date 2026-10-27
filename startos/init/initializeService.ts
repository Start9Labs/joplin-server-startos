import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { storeJson } from '../fileModels/store.json'
import { generateMfaKey, generatePassword } from '../utils'
import { resetPassword } from '../actions/resetPassword'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await storeJson.write(effects, {
      postgresPassword: generatePassword(),
      mfaEncryptionKey: generateMfaKey(),
      signupEnabled: false,
      smtp: { selection: 'disabled', value: {} },
    })

    await sdk.action.createOwnTask(effects, resetPassword, 'important', {
      reason: i18n(
        'Run Reset User Password to get the admin login (admin@localhost) for the web UI and your Joplin apps.',
      ),
    })
  } else {
    await storeJson.merge(effects, {})
  }
})
