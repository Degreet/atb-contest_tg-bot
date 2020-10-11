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
      } else if (username.startsWith("/")) {
        sendMsg(ctx, `В логине "<b>${username}</b>" используются недопустимые символы.`)
      } else {
        sendMsg(ctx, `<b>${username}</b>, Вы были успешно зарегистрированы!`)
        adminBot.telegram.sendMessage(582824629, `Новый пользователь: ${username}[${userId}].`)

        let collectedCards = 0
        const reged = await users.find().toArray()
        if (!reged.length) {
          await ctx.replyWithPhoto({ source: "img/cards/otal.jpg" })
          sendMsg(ctx, `Так как вы являетесь первым пользователем, вы получаете карту "Отал" бесплатно!`)
          collectedCards = 1
        }

        await users.insertOne({
          userId,
          username,
          collectedCards,
          win: false
        })

        sendMsg(ctx, `Ожидай конкурсов.`)
        await checker(ctx)
        ctx.scene.leave()
      }
    })

    return reg
  }
}

async function checker(ctx) {
  const userId = ctx.from.id
  const candidate = await getCandidate({ userId })

  if (candidate) {
    const username = candidate.username
    const article = await getContest()

    if (article) {
      const nowDate = new Date()
      const startDate = new Date(article.dateStart)

      const checkStartDate =
        nowDate.getDate() >= startDate.getDate() &&
        nowDate.getMonth() >= startDate.getMonth() &&
        nowDate.getFullYear() >= startDate.getFullYear() &&
        nowDate.getHours() >= startDate.getHours()

      if (checkStartDate) {
        const endDate = new Date(article.dateEnd)

        const checkEndDate =
          nowDate.getDate() > endDate.getDate() ||
          nowDate.getMonth() > endDate.getMonth() ||
          nowDate.getFullYear() > endDate.getFullYear() ||
          nowDate.getHours() >= endDate.getHours()

        if (!checkEndDate) {
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
    .replace(/rokethover/g, "Рокет и Ховер")
}

async function getContest() {
  const articles = await contests.find().toArray()
  return articles[0]
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