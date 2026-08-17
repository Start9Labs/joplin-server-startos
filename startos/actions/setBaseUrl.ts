import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { storeJson } from '../fileModels/store.json'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  baseUrl: Value.text({
    name: i18n('Base URL'),
    description: i18n(
      'A full URL including scheme, e.g. https://notes.example.com. Leave blank to auto-detect from your StartOS interface.',
    ),
    required: false,
    default: null,
    placeholder: 'https://notes.example.com',
  }),
})

export const setBaseUrl = sdk.Action.withInput(
  'set-base-url',

  async () => ({
    name: i18n('Set Base URL'),
    description: i18n(
      'Override the public base URL Joplin Server uses to generate links (share links, emails, and web UI redirects). Leave blank to use your StartOS address automatically.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async () => ({
    baseUrl: (await storeJson.read((s) => s.appBaseUrl).once()) ?? null,
  }),

  async ({ effects, input }) => {
    const trimmed = input.baseUrl?.trim()
    await storeJson.merge(effects, {
      appBaseUrl: trimmed ? trimmed : undefined,
    })
  },
)
