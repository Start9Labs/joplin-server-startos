import { setupManifest } from '@start9labs/start-sdk'
import { alertInstall, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'joplin-server',
  title: 'Joplin Server',
  license: 'Joplin Server Personal Use License',
  packageRepo: 'https://github.com/Start9Labs/joplin-server-startos',
  upstreamRepo: 'https://github.com/laurent22/joplin',
  marketingUrl: 'https://joplinapp.org/',
  donationUrl: 'https://joplinapp.org/donate/',
  description: { short, long },
  volumes: ['main', 'db'],
  images: {
    'joplin-server': {
      source: { dockerTag: 'joplin/server:3.7.1' },
      arch: ['x86_64', 'aarch64'],
    },
    postgres: {
      source: { dockerTag: 'postgres:16-alpine' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: alertInstall,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
