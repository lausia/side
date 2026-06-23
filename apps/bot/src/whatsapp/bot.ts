import { Boom } from "@hapi/boom"
import path from "path"
import qrcode from "qrcode-terminal"
import { prisma } from "@enso/database"
import { analyzeQuestion } from "../services/ai-service"
import { io } from "../index"

const sessionState: Map<string, { action: "question" | "vote"; questions?: any[] }> = new Map()
const AUTH_FOLDER = "/app/auth"

async function getEventState(phone: string) {
  const normalizedPhone = phone.startsWith("258") ? phone : `258${phone}`

  const participant = await prisma.participant.findUnique({
    where: { phone: normalizedPhone },
    include: {
      events: {
        include: { event: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!participant || participant.events.length === 0) {
    return { participant: null, event: null, state: "UNKNOWN" }
  }

  const now = new Date()

  let eventParticipant = participant.events.find(ep => {
    const e = ep.event
    return e.publicationStatus === "PUBLISHED" && now >= e.startTime && now <= e.endTime
  })

  if (!eventParticipant) {
    eventParticipant = participant.events.find(ep => {
      const e = ep.event
      return e.publicationStatus === "PUBLISHED" && now < e.startTime
    })
  }

  if (!eventParticipant) {
    eventParticipant = participant.events[0]
  }

  const event = eventParticipant.event
  let state = "UNKNOWN"

  if (event.publicationStatus === "CANCELLED") state = "CANCELLED"
  else if (event.publicationStatus === "DRAFT") state = "DRAFT"
  else if (now < event.startTime) state = "ACTIVE"
  else if (now >= event.startTime && now <= event.endTime) state = "LIVE"
  else state = "FINISHED"

  return { participant, eventParticipant, event, state }
}

async function handleLiveMessage(sock: any, from: string, text: string, participant: any, eventParticipant: any, event: any) {
  if (!eventParticipant.checkedIn) {
    await sock.sendMessage(from, { text: "Só participantes com check-in feito podem participar.\nDirija-se ao staff para fazer o check-in." })
    return
  }

  const session = sessionState.get(from)
  const lower = text.toLowerCase().trim()

  // Menu helper
  const showMenu = async () => {
    await sock.sendMessage(from, {
      text: `👋 Olá, ${participant.name}! O evento *${event.name}* está ao vivo.\n\nO que queres fazer?\n\n*1.* Ver perguntas e votar\n*2.* Fazer uma pergunta`,
    })
  }

  // Estado: aguarda pergunta
  if (session?.action === "question") {
    // Cancelar se mandar número ou palavra curta
    if (lower === "0" || lower === "cancelar" || lower === "menu") {
      sessionState.delete(from)
      await showMenu()
      return
    }

    if (text.length < 10) {
      await sock.sendMessage(from, { text: "Pergunta muito curta. Escreve uma pergunta completa ou envia *0* para cancelar." })
      return
    }

    sessionState.delete(from)
    await sock.sendMessage(from, { text: "⏳ A analisar a tua pergunta..." })
    const aiResult = await analyzeQuestion(text, event.topic ?? "evento geral")

    if (!aiResult.approved) {
      await sock.sendMessage(from, { text: `❌ Pergunta não aprovada.\n\n_Motivo: ${aiResult.reason}_` })
      await showMenu()
      return
    }

    const question = await prisma.question.create({
      data: {
        content: text,
        eventParticipantId: eventParticipant.id,
        status: "AI_APPROVED",
        aiScore: aiResult.score,
        aiReason: aiResult.reason,
      },
      include: {
        eventParticipant: { include: { participant: true } },
        votes: true,
      },
    })

    io.to(`event:${event.id}`).emit("question:new", { ...question, voteCount: 0 })

    await sock.sendMessage(from, {
      text: `✅ Pergunta aprovada e na fila!\n\n_"${text}"_\n\nOs participantes já podem votar nela.`,
    })
    await showMenu()
    return
  }

  // Estado: aguarda voto
  if (session?.action === "vote" && session.questions) {
    // Cancelar se não for número
    if (lower === "0" || lower === "cancelar" || lower === "menu" || isNaN(parseInt(text.trim()))) {
      sessionState.delete(from)
      await showMenu()
      return
    }

    const num = parseInt(text.trim())
    if (num < 1 || num > session.questions.length) {
      await sock.sendMessage(from, { text: `Número inválido. Escolhe entre 1 e ${session.questions.length}, ou envia *0* para cancelar.` })
      return
    }

    sessionState.delete(from)
    const chosen = session.questions[num - 1]

    if (chosen.eventParticipant.participant.id === participant.id) {
      await sock.sendMessage(from, { text: "❌ Não podes votar na tua própria pergunta." })
      await showMenu()
      return
    }

    try {
      await prisma.vote.create({
        data: { questionId: chosen.id, participantId: participant.id },
      })
      const voteCount = await prisma.vote.count({ where: { questionId: chosen.id } })
      io.to(`event:${event.id}`).emit("question:voted", { questionId: chosen.id, voteCount })
      await sock.sendMessage(from, { text: `✅ Voto registado!\n\n_"${chosen.content}"_` })
    } catch (err: any) {
      if (err?.code === "P2002") {
        await sock.sendMessage(from, { text: "Já votaste nesta pergunta." })
      } else {
        await sock.sendMessage(from, { text: "Erro ao registar voto." })
      }
    }
    await showMenu()
    return
  }

  // Sem sessão activa — processar menu
  if (lower === "1") {
    const questions = await prisma.question.findMany({
      where: {
        eventParticipant: { eventId: event.id },
        status: { in: ["AI_APPROVED", "APPROVED"] },
      },
      include: {
        votes: true,
        eventParticipant: { include: { participant: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    const sorted = questions
      .map((q: any) => ({ ...q, voteCount: q.votes.length }))
      .sort((a: any, b: any) => b.voteCount - a.voteCount)

    if (sorted.length === 0) {
      await sock.sendMessage(from, { text: "Ainda não há perguntas na fila." })
      await showMenu()
      return
    }

    sessionState.set(from, { action: "vote", questions: sorted })

    const lista = sorted
      .map((q: any, i: number) => `*${i + 1}.* ${q.content}\n     ${q.voteCount} votos`)
      .join("\n\n")

    await sock.sendMessage(from, {
      text: `📋 *Perguntas na fila:*\n\n${lista}\n\nResponde com o *número* da pergunta que queres votar, ou *0* para cancelar.`,
    })
    return
  }

  if (lower === "2") {
    sessionState.set(from, { action: "question" })
    await sock.sendMessage(from, { text: "✏️ Escreve a tua pergunta.\n\nEnvia *0* para cancelar." })
    return
  }

  // Qualquer outra mensagem — mostrar menu
  await showMenu()
}

async function handleMessage(sock: any, from: string,text: string, senderPn?: string) {

const rawPhone = senderPn 
    ? senderPn.replace("@s.whatsapp.net", "") 
    : from.replace("@s.whatsapp.net", "").replace("@lid", "")
  const phone = rawPhone.startsWith("258") ? rawPhone : `258${rawPhone}`
  console.log("📱 Phone final:", phone)

  const { participant, eventParticipant, event, state } = await getEventState(phone)

  if (!participant || !event) {
    await sock.sendMessage(from, {
      text: "Olá! Não encontrámos a tua inscrição. Inscreve-te primeiro através do link do evento.",
    })
    return
  }

  const eventName = event.name

  switch (state) {
    case "ACTIVE":
       await sock.sendMessage(from, {
    text: `Olá, ${participant.name}! 👋\n\nEstás inscrito no evento *${eventName}*.\n\n📅 *Data:* ${new Date(event.date).toLocaleDateString("pt-PT")}\n⏰ *Início:* ${new Date(event.startTime).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}\n\n🔔 Enviaremos um lembrete 1h antes. Até lá!`,
  })
      break

    case "LIVE":
      await handleLiveMessage(sock, from, text, participant, eventParticipant, event)
      break

    case "FINISHED":
      await sock.sendMessage(from, {
        text: `O evento *${eventName}* ja terminou. Obrigado pela tua participacao! `,
      })
      break

    case "CANCELLED":
      await sock.sendMessage(from, {
        text: `O evento *${eventName}* foi cancelado. Pedimos desculpa pelo inconveniente.`,
      })
      break

    default:
      await sock.sendMessage(from, { text: "Olá! Como posso ajudar?" })
  }
}

export async function startWhatsAppBot() {
  const baileys = await (new Function('return import("@whiskeysockets/baileys")')())
const makeWASocket = baileys.default
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update: any) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
  qrcode.generate(qr, { small: true })
  const QRCode = require("qrcode")
  QRCode.toDataURL(qr).then((url: string) => {
    process.env._QR_CODE = url
  })
}

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut

      console.log("Conexo fechada. Reconectando:", shouldReconnect)
      if (shouldReconnect) startWhatsAppBot()
    } else if (connection === "open") {
      console.log(" WhatsApp Bot conectado!")
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }: any) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue

      const from = msg.key.remoteJid
      console.log("📨 Mensagem de:", from)
      if (!from || from.includes("@g.us")) continue

      console.log("MSG FULL:", JSON.stringify(msg).substring(0, 800))

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        ""

      if (!text) continue

      try {
        await handleMessage(sock, from, text, msg.key.senderPn)
      } catch (err) {
        console.error("Erro ao processar mensagem:", err)
      }
    }
  })

  return sock
}
