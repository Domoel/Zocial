import { accountsCache, clearCache, metaCache, statusesCache } from './cache.js'
import { deleteDatabase } from './databaseLifecycle.ts'

export async function clearDatabaseForInstance (instanceName) {
  clearCache(statusesCache, instanceName)
  clearCache(accountsCache, instanceName)
  clearCache(metaCache, instanceName)
  await deleteDatabase(instanceName)
}

export { markInstanceLoggedOut } from './databaseLifecycle.ts'
