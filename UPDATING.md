# Updating the upstream version

This package wraps the unmodified `joplin/server` image and bundles an internal `postgres` image.

## Determining the upstream version

- Check the [Joplin Server changelog](https://github.com/laurent22/joplin/blob/dev/readme/about/changelog/server.md), not the Joplin client release tags.
- Confirm the corresponding stable `joplin/server:<version>` tag exists on [Docker Hub](https://hub.docker.com/r/joplin/server/tags). Upstream documents `latest` as the most recent released server and `beta` as the most recent beta.
- Verify the image supports both `linux/amd64` and `linux/arm64` before updating the pin.

The image pins live in `startos/manifest/index.ts` at `images['joplin-server'].source.dockerTag` and `images.postgres.source.dockerTag`.

## Applying the bump

1. Update the Joplin image pin in `startos/manifest/index.ts`.
2. Update `version` and `releaseNotes` in `startos/versions/current.ts`, using the server version followed by `:0` for a new upstream release.
3. Review upstream changes to environment variables, database migrations, authentication, and the sync API.
4. Run `npm ci`, `npm run check`, and `make`. Verify startup, password-reset login, and a client sync against the installed package.

PostgreSQL patch updates within the pinned major follow its image tag. A PostgreSQL major upgrade needs a database migration plan; do not simply change the major tag against an existing data directory.
