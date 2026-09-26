export const db = { statuses: {}, notifications: {}, failInsert: false }
export const database = {
  getStatus: async (instanceName, id) => db.statuses[id],
  getNotification: async (instanceName, id) => db.notifications[id],
  async insertTimelineItems () {
    if (db.failInsert) throw new Error('QuotaExceededError')
  },
  deleteStatusesAndNotifications: async () => {}
}
