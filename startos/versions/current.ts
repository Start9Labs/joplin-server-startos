import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '3.7.1:0',
  releaseNotes: {
    en_US: 'Initial release of Joplin Server for StartOS.',
    es_ES: 'Versión inicial de Joplin Server para StartOS.',
    de_DE: 'Erste Veröffentlichung von Joplin Server für StartOS.',
    pl_PL: 'Pierwsze wydanie Joplin Server dla StartOS.',
    fr_FR: 'Première version de Joplin Server pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
