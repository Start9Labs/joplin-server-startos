import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const primaryUrl = sdk.setupPrimaryUrl({
  id: 'set-base-url',
  hostId: 'ui-multi',
  interfaceId: 'ui',
  metadata: {
    name: i18n('Set Base URL'),
    description: i18n(
      'Choose the one address Joplin Server answers on: the web UI and every Joplin app must use it, and share and email links point to it. Requests to any other address are refused. Joplin Server restarts to apply a change.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  },
  field: { name: i18n('Base URL'), description: null },
  get: storeJson.read((s) => s.appBaseUrl),
  set: (effects, url) => storeJson.merge(effects, { appBaseUrl: url }),
})
