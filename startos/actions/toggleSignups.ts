import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

export const toggleSignups = sdk.Action.withoutInput(
  'toggle-signups',

  async ({ effects }) => {
    const enabled = await storeJson.read((s) => s.signupEnabled).const(effects)
    return {
      name: enabled ? i18n('Disable Signups') : i18n('Enable Signups'),
      description: enabled
        ? i18n(
            'Signups are currently enabled. Run this action to disable new account registration.',
          )
        : i18n(
            'Signups are currently disabled. Run this action to allow new users to register their own accounts.',
          ),
      warning: enabled
        ? null
        : i18n(
            'Anyone with access to your Joplin Server URL will be able to create an account.',
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const enabled = await storeJson.read((s) => s.signupEnabled).once()
    await storeJson.merge(effects, { signupEnabled: !enabled })
  },
)
