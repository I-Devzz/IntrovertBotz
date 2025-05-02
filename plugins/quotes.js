let handler = async (m, { conn, usedPrefix, command }) => {
   try {
      m.reply(global.status.wait)
      let json = await Key.neoxr(`/${command}`)
      
      if (!json.status) {
         return conn.reply(m.chat, Func.jsonFormat(json || { status: false, message: "Error fetching data" }), m)
      }

      conn.reply(m.chat, json.data.text, m)
   } catch (error) {
      console.error(error)
      conn.reply(m.chat, "Terjadi kesalahan saat mengambil data.", m)
   }
}

handler.command = handler.help = ["bucin", "senja", "fakta", "galau", "fml", "dilan", "pantun", "puisi", "sindiran"]
handler.tags = ["quotes"]
handler.limit = true

module.exports = handler
