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
const uri = `mongodb+srv://Node:${KEY}@cluster0-ttfss.mongodb.net/atb-contest-tg-bot?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

const TOKEN = process.env.TOKEN
const bot = new Telegraf(TOKEN)

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
    sendMsg(ctx, `С возвращением, <b>${username}</b>!`)
  } else {
    sendMsg(ctx, `Привет, новичок!`)
    ctx.scene.enter("reg")
  }
})

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
  bot.launch()
})