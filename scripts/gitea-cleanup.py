#!/usr/bin/env python3
"""Housekeeping for this Gitea repository: old Actions runs (with their artifacts and
logs) and old commit-SHA image tags in the container registry.

Policy
  runs       per workflow keep the newest KEEP_RUNS completed runs, delete the rest
             (their artifacts and logs go with them); runs that are still waiting or
             running are never touched
  artifacts  anything not belonging to a kept or active run is deleted as well
  registry   keep `latest`, branch and version tags and the newest KEEP_SHA_TAGS
             `sha-*` tags, delete older `sha-*` tags; untagged manifests are left to
             Gitea's own package cleanup

Environment
  GITEA_SERVER   e.g. https://git.ztfr.eu                              required
  GITEA_REPO     owner/name                                             required
  GITEA_TOKEN    token with write:repository and write:package          required
  KEEP_RUNS      newest runs to keep per workflow, default 3
  KEEP_SHA_TAGS  newest sha-* image tags to keep, default 10
  DRY_RUN        true/false, default true: only report, delete nothing
  PACKAGE        container package name, default: repo name lower-cased

Exit code 0 on success (dry run included), 1 on API errors.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

SHA_TAG = re.compile(r"^sha-[0-9a-f]{7,40}$")
PAGE_SIZE = 50
ACTIVE_RUN_STATUSES = {"waiting", "running", "in_progress", "queued", "blocked"}


def env(name, default=None):
    """Environment value, empty strings count as unset (workflow_dispatch inputs)."""
    value = os.environ.get(name, "")
    return value if value.strip() else default


# --- pure selection logic (unit tested below, no network) ---------------------------


def select_runs_to_delete(runs, keep):
    """Return (ids of runs to keep, runs to delete). Active runs are always kept."""
    keep_ids = set()
    to_delete = []
    by_workflow = {}
    for run in runs:
        if run.get("status") in ACTIVE_RUN_STATUSES:
            keep_ids.add(run["id"])
            continue
        by_workflow.setdefault(run.get("path") or "?", []).append(run)
    for path, items in by_workflow.items():
        items.sort(key=lambda r: r["id"], reverse=True)
        for run in items[:keep]:
            keep_ids.add(run["id"])
        to_delete.extend(items[keep:])
    return keep_ids, to_delete


def select_artifacts_to_delete(artifacts, keep_run_ids):
    return [a for a in artifacts if (a.get("workflow_run") or {}).get("id") not in keep_run_ids]


def select_tags_to_delete(versions, keep):
    """versions: iterable of dicts with `version` and `created_at`."""
    sha_tags = [v for v in versions if SHA_TAG.match(v.get("version", ""))]
    sha_tags.sort(key=lambda v: v.get("created_at", ""), reverse=True)
    return sha_tags[keep:]


# --- Gitea API -----------------------------------------------------------------------


class Gitea:
    def __init__(self, server, token):
        self.base = server.rstrip("/") + "/api/v1"
        self.token = token

    def call(self, method, path, query=None):
        url = self.base + path
        if query:
            url += "?" + urllib.parse.urlencode(query)
        request = urllib.request.Request(url, method=method)
        request.add_header("Accept", "application/json")
        if self.token:
            request.add_header("Authorization", "token " + self.token)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read()
                return json.loads(body) if body else None
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", "replace")[:300]
            raise RuntimeError(f"{method} {path} -> HTTP {error.code}: {detail}") from None

    def paginate(self, path, query=None, key=None):
        page = 1
        while True:
            data = self.call("GET", path, {**(query or {}), "page": page, "limit": PAGE_SIZE})
            items = data.get(key, []) if key else data
            if not items:
                return
            yield from items
            if len(items) < PAGE_SIZE:
                return
            page += 1


def main():
    server = env("GITEA_SERVER")
    repo = env("GITEA_REPO")
    token = env("GITEA_TOKEN")
    dry_run = env("DRY_RUN", "true").lower() in ("1", "true", "yes")
    keep_runs = int(env("KEEP_RUNS", "3"))
    keep_sha_tags = int(env("KEEP_SHA_TAGS", "10"))
    if not server or not repo or "/" not in repo:
        sys.exit("GITEA_SERVER and GITEA_REPO (owner/name) are required")
    if not token:
        sys.exit("GITEA_TOKEN is required")
    owner, name = repo.split("/", 1)
    package = env("PACKAGE", name.lower())
    api = Gitea(server, token)
    mode = "DRY RUN, nothing is deleted" if dry_run else "LIVE"
    print(f"Cleanup for {repo} ({mode}): keep {keep_runs} runs per workflow, {keep_sha_tags} sha tags")

    failures = 0

    def delete(label, path):
        nonlocal failures
        if dry_run:
            print(f"  would delete {label}")
            return
        try:
            api.call("DELETE", path)
            print(f"  deleted {label}")
        except RuntimeError as error:
            failures += 1
            print(f"  FAILED {label}: {error}")

    # 1. workflow runs (artifacts and logs go with them)
    runs = list(api.paginate(f"/repos/{owner}/{name}/actions/runs", key="workflow_runs"))
    keep_ids, old_runs = select_runs_to_delete(runs, keep_runs)
    print(f"\nRuns: {len(runs)} found, {len(keep_ids)} kept, {len(old_runs)} to delete")
    for run in sorted(old_runs, key=lambda r: r["id"]):
        label = f"run #{run.get('run_number')} ({run.get('path')}, {run.get('status')}, {run.get('html_url')})"
        delete(label, f"/repos/{owner}/{name}/actions/runs/{run['id']}")

    # 2. artifacts that do not belong to a kept or active run
    artifacts = (api.call("GET", f"/repos/{owner}/{name}/actions/artifacts") or {}).get("artifacts", [])
    old_artifacts = select_artifacts_to_delete(artifacts, keep_ids)
    total_mb = sum(a.get("size_in_bytes", 0) for a in old_artifacts) / 1e6
    print(f"\nArtifacts: {len(artifacts)} found, {len(old_artifacts)} to delete ({total_mb:.0f} MB)")
    for artifact in old_artifacts:
        run_id = (artifact.get("workflow_run") or {}).get("id")
        label = f"artifact {artifact.get('name')} (id {artifact.get('id')}, run {run_id}, {artifact.get('size_in_bytes', 0) / 1e6:.0f} MB)"
        delete(label, f"/repos/{owner}/{name}/actions/artifacts/{artifact['id']}")

    # 3. container registry: old sha-* tags of the image built by docker.yml
    versions = [
        p for p in api.paginate(f"/packages/{owner}", {"type": "container", "q": package}) if p.get("name") == package
    ]
    old_tags = select_tags_to_delete(versions, keep_sha_tags)
    sha_count = sum(1 for v in versions if SHA_TAG.match(v.get("version", "")))
    print(f"\nRegistry {owner}/{package}: {len(versions)} versions, {sha_count} sha tags, {len(old_tags)} to delete")
    for version in sorted(old_tags, key=lambda v: v.get("created_at", "")):
        label = f"tag {version['version']} ({version.get('created_at', '')[:10]})"
        delete(label, f"/packages/{owner}/container/{package}/{urllib.parse.quote(version['version'], safe='')}")

    if failures:
        sys.exit(f"\n{failures} deletion(s) failed")
    print("\nDone.")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as error:
        sys.exit(f"API error: {error}")
