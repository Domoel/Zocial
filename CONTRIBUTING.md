# Contributing to Zocial

## Building

Zocial requires [Node.js](https://nodejs.org/en/) and [pnpm](https://pnpm.io).

To build Zocial for production, first install dependencies:

    pnpm install --frozen-lockfile

Then build:

    pnpm build

Then run:

    PORT=4002 node server.js

### Single-Instance Mode

To build Zocial as a frontend for one instance, set the SINGLE_INSTANCE environment variable.

    SINGLE_INSTANCE=your.domain.tld pnpm build

### Exporting

Zocial is a static site. When you run `pnpm build`, static files will be
written to `__sapper__/export`.

## Installing

To install with dev dependencies, run:

    pnpm install

## Dev server

To run a dev server with hot reloading:

    pnpm dev

Now it's running at `localhost:4002`.

## Linting

Zocial uses [JavaScript Standard Style](https://standardjs.com/).

Lint:

    pnpm lint

Automatically fix most linting issues:

    pnpm lint-fix

## Tests

Unit tests for the parts that broke before (caches, streaming, rendering, compose, logout, several tabs, …) live in `test/`:

    pnpm test

`bin/run-tests.js` bundles each `test/*.test.js` with esbuild and runs it with Node's test runner. The app code is written for the browser, so a test swaps the modules it can't load in Node for mocks from `test/mocks/`, declared at the top of the file:

    // @mock _store/store.js -> ./mocks/timelineStore.js
    // @define ZOCIAL_IS_BROWSER=true

Svelte components have no tests of their own. When a component breaks because of its logic (a computed value, a decision), move that logic into a plain function, test the function and let the component call it. Layout and device behaviour are checked on dev.

Tests for the database layer import `fake-indexeddb/auto` and run the real `src/routes/_database` modules against it. A test that never settles fails after 30 seconds.

The Docker build runs `pnpm run lint && pnpm test` before building, so a failing check builds no image (and Watchtower keeps the running one).

## Debug build

To disable minification in a production build (for debugging purposes), you can run:

    DEBUG=1 pnpm build

## Debugging Webpack

The Webpack Bundle Analyzer `report.html` and `stats.json` are available publicly via e.g.:

- https://enafore.social/client/report.html
- https://enafore.social/client/stats.json

This is also available locally after `pnpm build` at `.sapper/client/report.html`.

## Architecture

See [Architecture.md](https://github.com/enafore/enafore/blob/main/docs/Architecture.md).

## Internationalization

See [Internationalization.md](https://github.com/enafore/enafore/blob/main/docs/Internationalization.md).

