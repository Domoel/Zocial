// This is the Sapper server, which we only run during `sapper export`.

import * as sapper from '../__sapper__/server.js'
import express from 'express'
import { store } from './routes/_store/store.js'

const { PORT = 4002 } = process.env
const app = express()

app.use(express.static('static'))
// Provide the app-wide store as the root store so every component inherits `$`-access (e.g. the
// reactive `$messages` i18n map) without each binding it individually. Same singleton on the
// client (see client.js); on the server it runs with browser guards off.
app.use(sapper.middleware({ store: () => store }))

app.listen(PORT, () => console.log(`listening on port ${PORT}`))

// Handle SIGINT (source: https://github.com/pouchdb/pouchdb-server/blob/fdc6ba7/packages/node_modules/pouchdb-server/lib/index.js#L304-L306)
process.on('SIGINT', () => process.exit(0))
