let { proto } = require('@whiskeysockets/baileys')
let handler = async (m, { conn, command, usedPrefix, text }) => {
  let M = proto.WebMessageInfo
  let which = command.replace(/add/i, '')
  if (!m.quoted) throw `Balas pesan dengan perintah *${usedPrefix + command}*`
  if (!text) throw `Pengunaan:${usedPrefix + command} <teks>\n\nContoh:\n${usedPrefix + command} tes`
  let msgs = db.msgs
  if (text in msgs) throw `'${text}' telah terdaftar!`
  msgs[text] = M.fromObject(await m.getQuotedObj()).toJSON()
  await conn.reply(m.chat, `Berhasil menambahkan pesan '${text}'\n\nakses dengan ${usedPrefix}get${which} ${text}`, m)
}
handler.help = ['addvn', 'addmsg', 'addvideo', 'addaudio', 'addimg', 'addstiker', 'addgif']
handler.tags = ['store']
handler.command = ['addvn', 'addmsg', 'addvideo', 'addaudio', 'addimg', 'addstiker', 'addgif']
handler.group = true
handler.register = true
module.exports = handler