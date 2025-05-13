let handler = async (m, { conn, usedPrefix, text }) => {
   try {
      if (!text) return conn.reply(m.chat, "Where is the queries?")
      m.reply(global.status.wait)
      let json = await Key.neoxr(`/${text}`)
      
      if (!json.status) {
         return conn.reply(m.chat, Func.jsonFormat(json || { status: false, message: "Error fetching data" }), m)
      }

      conn.reply(m.chat, json.data.text, m)
   } catch (error) {
      console.error(error)
      conn.reply(m.chat, "Terjadi kesalahan saat mengambil data.", m)
   }
}

handler.command = ["gptpro"]
handler.help = ["gotpro <query>"]
handler.tags = ["ai"]
handler.limit = true

module.exports = handler
