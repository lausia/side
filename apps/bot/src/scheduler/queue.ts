import { Queue } from "bullmq"
import IORedis from "ioredis"

console.log("=== QUEUE.TS NOVO CARREGADO ===")

const connection = new IORedis({
  host: "yamanote.proxy.rlwy.net",
  port: 53545,
  username: "default",
  password: "JAiQAOYxrlxnsfHsqthqAuKFdcAdltQC",
  maxRetriesPerRequest: null,
})

export { connection }
export const reminderQueue = new Queue("reminders", { connection })
export const followUpQueue = new Queue("followups", { connection })
console.log("=== QUEUES CRIADAS ===")
