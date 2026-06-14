import { database } from '../_database/database.js'
import { scheduleIdleTask } from '../_utils/scheduleIdleTask.js'

async function doUpdateStatus (instanceName, newStatus) {
  await database.updateStatus(instanceName, newStatus)
}

export function updateStatus (instanceName, newStatus) {
  scheduleIdleTask(() => {
    /* no await */ doUpdateStatus(instanceName, newStatus)
  })
}
