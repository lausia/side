import { Queue } from "bullmq"
import { Redis } from "bullmq"

const connection = new Redis({
  host: "yamanote.proxy.rlwy.net",
  port: 53545,
  username: "default",
  password: "JAiQAOYxrlxnsfHsqthqAuKFdcAdltQC",
  maxRetriesPerRequest: null,
} as any)

console.log("Connecting to Redis: yamanote.proxy.rlwy.net:53545")

export { connection }
export const reminderQueue = new Queue("reminders", { connection })
export const followUpQueue = new Queue("followups", { connection })
