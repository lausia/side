import { Queue } from "bullmq"
import IORedis from "ioredis"

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"
console.log("Connecting to Redis:", redisUrl)

export const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })

export const reminderQueue = new Queue("reminders", { connection })
export const followUpQueue = new Queue("followups", { connection })

console.log("✅ Queues BullMQ inicializadas")