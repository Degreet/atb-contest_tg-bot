const Scene = require("telegraf/scenes/base")
const Extra = require("telegraf/extra")
const Markup = require("telegraf/markup")

class SceneGen {
  registration() {
    const reg = new Scene("reg")

    reg.enter(ctx => {
      sendMsg(ctx, `Как тебя зовут? Придумай себе уникальный логин, и напиши его мне!`)
    })

    reg.on("message", async ctx => {
      const username = ctx.message.text
      const userId = ctx.from.id
      const candidate = await getCandidate({ username })

      if (candidate) {
        sendMsg(ctx, `Логин <b>${username}</b> уже занят. Попробуйте другой.`)
      } else if (username.includes("/")) {
        sendMsg(ctx, `В логине "<b>${username}</b>" используются недопустимые символы.`)
      } {
        await users.insertOne({
          userId,
          username
        })

        sendMsg(ctx, `<b>${username}</b>, Вы были успешно зарегистрированы!`)
        ctx.scene.leave()
      }
    })

    return reg
  }
}

async function getCandidate(data) {
  const { userId, username } = data
  return await users.findOne(userId ? { userId } : username ? { username } : { userId: "dsahfiuo3189hnsak" })
}

function sendMsg(ctx, text, markup = []) {
  return ctx.replyWithHTML(text, setMarkup(markup))
}

function setMarkup(markup) {
  return Markup.keyboard(markup).oneTime().resize().extra();
}

module.exports = SceneGen