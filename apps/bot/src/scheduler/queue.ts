import { Queue } from "bullmq"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
console.log("Connecting to Redis:", redisUrl)

const connection = {
  url: redisUrl,
}

export { connection }
export const reminderQueue = new Queue("reminders", { connection })
export const followUpQueue = new Queue("followups", { connection })

console.log("✅ Queues BullMQ inicializadas")