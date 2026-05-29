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
  } else {
    const existing = await storeJson.read().once()
    await storeJson.merge(effects, {
      postgresPassword: existing?.postgresPassword || generatePassword(),
      mfaEncryptionKey: existing?.mfaEncryptionKey || generateMfaKey(),
    })
  }

  await sdk.action.createOwnTask(effects, resetPassword, 'important', {
    reason: i18n(
      'Joplin Server ships with default admin credentials (admin@localhost / admin). Set a strong password from the "Reset User Password" action right away.',
    ),
  })
})
