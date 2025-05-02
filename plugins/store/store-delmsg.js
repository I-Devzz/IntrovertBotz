let handler = async (m, { command, usedPrefix, text }) => {
  let which = command.replace(/del/i, '')
  if (!text) throw `Gunakan *${usedPrefix}list${which}* untuk melihat daftar nya`
  let msgs = global.db.msgs
  if (!text in msgs) throw `'${text}' tidak terdaftar di daftar pesan`
  delete msgs[text]
  m.reply(`Berhasil menghapus pesan di daftar pesan dengan nama '${text}'`)
}
handler.help = ['delvn', 'delmsg', 'delvideo', 'delaudio', 'delimg', 'delsticker', 'delgif']
handler.tags = ['store']
handler.command = ['delvn', 'delmsg', 'delvideo', 'delaudio', 'delimg', 'delsticker', 'delgif']
module.exports = handler