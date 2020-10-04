const { Telegraf } = require("telegraf")
const Extra = require("telegraf/extra")
const Markup = require("telegraf/markup")
const { Stage, session } = Telegraf
const SceneGen = require("./Scenes")
const http = require("http")

const server = http.createServer((req, resp) => resp.end("Error #404"))
server.listen(process.env.PORT || 3000)

const dotenv = require("dotenv")
dotenv.config()

const KEY = process.env.KEY
const { MongoClient, ObjectId, BSONType } = require("mongodb")
const { send } = require("process")
const uri = `mongodb+srv://Node:${KEY}@cluster0-ttfss.mongodb.net/atb-contest-tg-bot?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

const TOKEN = process.env.TOKEN
const bot = new Telegraf(TOKEN)

const ADMIN_TOKEN = process.env.ADMIN_TOKEN
const adminBot = new Telegraf(ADMIN_TOKEN)

adminBot.on("message", async ctx => {
  const msg = ctx.message.text

  if (msg.startsWith("/unset_win ")) {
    try {
      const userId = Number(msg.replace("/unset_win ", ""))
      await users.updateOne({ userId }, { $set: { win: false } })
      sendMsg(ctx, "Успешно сделано!")
    } catch {
      sendMsg(ctx, "Ошибка.")
    }
  } else if (msg.startsWith("/ban ")) {
    const userId = Number(msg.slice(5, 14))
    const msgToBan = msg.slice(15)
    const candidate = await getCandidate({ userId })

    await users.deleteOne({ userId })
    bot.telegram.sendMessage(userId, `Привет, ${candidate.username}! Ваш аккаунт был удалён по причине: "${msgToBan}". Чтобы начать всё снова, введите /start`)
    sendMsg(ctx, `Успешно сделано!`)
  } else {
    ctx.reply("Неизвестная команда.")
  }
})

const curScenes = new SceneGen()
const regScene = curScenes.registration()
const stage = new Stage([regScene])
bot.use(session())
bot.use(stage.middleware())

bot.command("start", async ctx => {
  const userId = ctx.from.id
  const candidate = await getCandidate({ userId })

  await ctx.replyWithPhoto({ source: "img/logo.png" })

  if (candidate) {
    const username = candidate.username
    sendMsg(ctx, `С возвращением, <>${username}</>!`)
  } else {
    sendMsg(ctx, `Привет, новичок!`)
    ctx.scene.enter("reg")
  }
})

bot.on("message", async ctx => {
  const msg = ctx.message.text.toLowerCase()
  const userId = ctx.from.id
  const candidate = await getCandidate({ userId })

  if (candidate) {
    if (msg == "/go") {
      if (candidate.win) {
        sendMsg(ctx, `На данный момент новых конкурсов не имеется.`)
      } else {
        const article = await getContest()
        const win = rndGift(article)
        const winFormated = formatGift(win)
        await ctx.replyWithPhoto({ source: `img/cards/${win.replace("-", "")}.jpg` })
        await users.updateOne({ userId }, { $set: { win, collectedCards: candidate.collectedCards + 1 } })
        sendMsg(ctx, `Ваша награда: <b>${winFormated}</b>. Чтобы узнать как забрать/отдать приз, введите /getcard.`)
        adminBot.telegram.sendMessage(582824629, `Игрок ${candidate.username}[${userId}] получил ${winFormated}.`)
      }
    } else if (msg == "/getcard") {
      sendMsg(ctx, `Чтобы получить карту, ты должен прийти к 103 школе к 6Г классу, и на перемене узнать у "Жайворонка/Войцеховского" на счёт карты.`)
    } else if (msg == "/check") {
      await checker(ctx)
    } else {
      sendMsg(ctx, `Неизвестная команда.`)
    }
  }
})

async function checker(ctx) {
  const userId = ctx.from.id
  const candidate = await getCandidate({ userId })

  if (candidate) {
    const username = candidate.username
    const article = await getContest()

    if (article) {
      const nowDate = new Date()
      const endDate = new Date(article.dateEnd)
      const checkDate = nowDate.getDate() > endDate.getDate()
        || nowDate.getMonth() > endDate.getMonth()
        || nowDate.getFullYear() > endDate.getFullYear()
        || nowDate.getHours() > endDate.getHours()

      if (!checkDate) {
        let checked = false
        article.checked.forEach(name => name == username ? checked = true : "")
        const gifts = article.content

        if (!checked) {
          sendMsg(ctx, `
Привет, <b>${username}</b>!
Начался новый конкурс!
Призы: ${formatGifts(gifts)}.
Чтобы участвовать, введи /go.
          `)

          article.checked.push(username)
          await contests.updateOne({ _id: article._id }, { $set: { checked: article.checked } })
        }
      }
    }
  }

  setTimeout(checker, 10000, ctx)
}

function formatGifts(gifts) {
  return gifts.join(", ")
    .replace(/magar/g, "Магар")
    .replace(/ledi/g, "Леди орейн")
    .replace(/haos/g, "Хаос")
    .replace(/heming/g, "Хэминг")
    .replace(/orion/g, "ОРИОН")
    .replace(/card/g, "1 карта")
}

function rndGift(contest) {
  const content = contest.content
  return content[Math.floor(Math.random() * content.length)]
}

function formatGift(gift) {
  return gift
    .replace(/magar/g, "Магар")
    .replace(/ledi/g, "Леди орейн")
    .replace(/haos/g, "Хаос")
    .replace(/heming/g, "Хэминг")
    .replace(/orion/g, "ОРИОН")
    .replace(/card/g, "1 карта")
}

async function getContest() {
  const articles = await contests.find().toArray()
  return articles[0]
}

function buildPath(path) {
  return `${__dirname}/${path}`
}

function sendMsg(ctx, text, markup = []) {
  return ctx.replyWithHTML(text, setMarkup(markup))
}

function setMarkup(markup) {
  return Markup.keyboard(markup).oneTime().resize().extra();
}

async function getCandidate(data) {
  const { userId, username } = data
  return await users.findOne(userId ? { userId } : username ? { username } : { userId: "dsahfiuo3189hnsak" })
}

client.connect(err => {
  if (err) console.log(err)

  global.users = client.db("atb-contest-tg-bot").collection("users")
  global.contests = client.db("atb-contest-tg-bot").collection("contests")
  global.adminBot = adminBot

  adminBot.launch()
  bot.launch()
})