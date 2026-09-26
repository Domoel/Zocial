import { database } from '../_database/database.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'
import { emit } from '../_utils/eventBus.ts'
import { rehydrateStatusOrNotification } from './rehydrateStatusOrNotification.js'

// A streamed `status.update` (someone edited a post)
async function doUpdateStatus (instanceName, newStatus) {
  await database.updateStatus(instanceName, newStatus)
  // show the edit in already-rendered posts too (Status.html swaps in the updated status)
  await rehydrateStatusOrNotification({ status: newStatus })
  emit('statusUpdated', newStatus)
}

export function updateStatus (instanceName, newStatus) {
  scheduleIdleTask(() => {
    doUpdateStatus(instanceName, newStatus).catch(e => console.error('failed to apply status edit', e))
  })
}
