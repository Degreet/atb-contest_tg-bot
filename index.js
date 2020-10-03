const { Telegraf } = require("telegraf")
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const { Stage, session } = Telegraf;
const SceneGen = require("./Scenes");

const dotenv = require("dotenv")
dotenv.config()

const KEY = process.env.KEY
const { MongoClient, ObjectId, BSONType } = require("mongodb")
const uri = `mongodb+srv://Node:${KEY}@cluster0-ttfss.mongodb.net/atb-contest-tg-bot?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })

const TOKEN = process.env.TOKEN
const bot = new Telegraf(TOKEN)

bot.command("start", ctx => {
  ctx.reply("Привет!")
})

client.connect((err) => {
  if (err) console.log(err)
  global.users = client.db("atb-contest-tg-bot").collection("users")
  bot.launch()
})