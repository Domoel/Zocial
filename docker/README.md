# Deployment: Gitea Actions → Gitea registry → Synology

Every push to `main` or `dev` runs [.gitea/workflows/docker.yml](../.gitea/workflows/docker.yml): the image is
built from the `Dockerfile` and pushed to the Gitea container registry of this instance.

| Trigger | Image tags | Release channel |
|---|---|---|
| push to `main` | `git.ztfr.eu/dome/zocial:latest`, `:main` | prod |
| push to `dev` | `:dev` | dev |
| release tag (e.g. `1.12.0`) | `:1.12.0`, a fixed rollback point | prod |
| every build | `:sha-<short commit>` | as above |

Docs-only pushes (`docs/**`, `*.md`) don't trigger a build. A run can also be started by hand under
*Actions → Docker image → Run workflow*.

On the Synology, Watchtower polls the registry and recreates a container as soon as the tag it runs
(`:latest` for production, `:dev` for the dev instance) gets a new image. Its HTTP API can trigger an
update by hand: `curl -H "Authorization: Bearer <token>" http://<nas>:8080/v1/update`.

## One-time setup on Gitea

- A runner (`act_runner`) with the `ubuntu-latest` label and access to the Docker socket (the default
  `act_runner` config mounts it into job containers). The Zeitfresser Messenger uses the same runner.
- Personal access token: *Settings → Applications → Generate token* with `write:package`. Store it
  as repository secret `REGISTRY_TOKEN` (*Repository → Settings → Actions → Secrets*).
- Packages follow the visibility of the repository. Zocial is public, so the NAS can pull without
  credentials; for a private package set `REPO_USER` / `REPO_PASS` (token with `read:package`) in the
  `.env` of the Watchtower that updates it.

## One-time setup on the Synology (Container Manager)

1. Create a folder per environment, e.g. `/volume1/docker/zocial` (and `/volume1/docker/zocial-dev`),
   and copy [synology/docker-compose.yml](synology/docker-compose.yml) plus a filled-in `.env`
   (start from [synology/example.env](synology/example.env)) into it. For the dev instance set
   `ZOCIAL_IMAGE=git.ztfr.eu/dome/zocial:dev`, a different `ZOCIAL_CONTAINER_NAME` and `ZOCIAL_PORT`.
2. *Container Manager → Project → Create*, pick that folder and use the existing `docker-compose.yml`.
3. Zocial is then served on `http://<nas>:6666` (see `ZOCIAL_PORT`); put your reverse proxy in front.

### Watchtower: one per NAS

The Zocial container carries the label `com.centurylinklabs.watchtower.enable=true`. **A Watchtower that
already runs on the NAS (e.g. the one from the Zeitfresser Messenger project, with
`WATCHTOWER_LABEL_ENABLE=true`) picks it up automatically.** Nothing else to do.

Only if no Watchtower runs yet, enable the bundled one with `COMPOSE_PROFILES=watchtower` in the `.env`.
Don't run two: an unscoped Watchtower stops every other Watchtower instance when it starts.

## Without Watchtower

Pull `git.ztfr.eu/dome/zocial:latest` under *Container Manager → Image* (add the Gitea host under
*Registry → Settings* first if the package is private) and rebuild the project. Updating is then a
manual "pull image, rebuild project".

Outside the Synology, the generic [docker/docker-compose.yaml](docker-compose.yaml) +
[docker/.env.example](.env.example) pull the same image with plain `docker compose`
(host port `PORT`, default 80).

## Docker Hub (backup)

[.gitea/workflows/build-image.yml](../.gitea/workflows/build-image.yml) still builds and pushes
`domoel/zocial:latest` / `:dev` to Docker Hub, **manually only** (*Actions → Docker Hub image (backup)*),
for when the Gitea registry is unavailable. It needs the secrets `DOCKER_USERNAME` / `DOCKER_PASSWORD`.

## Housekeeping

[.gitea/workflows/cleanup.yml](../.gitea/workflows/cleanup.yml) runs every Sunday and keeps the newest 3
runs per workflow (older runs go together with their artifacts and logs) plus the newest 10 `sha-*` image
tags in the registry; `latest`, branch and version tags are never touched. Start it by hand for a dry run
that only lists what would be deleted. It needs a secret `CLEANUP_TOKEN` with `write:repository` and
`write:package` (or a `REGISTRY_TOKEN` carrying both scopes). Logic: [scripts/gitea-cleanup.py](../scripts/gitea-cleanup.py).
