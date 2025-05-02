let handler = async (m, { conn, command, usedPrefix, text }) => {
  let which = command.replace(/get/i, '')
  if (!text) throw `Gunakan *${usedPrefix}list${which}* untuk melihat daftar nya`
  let msgs = global.db.msgs
  if (!(text in msgs)) throw `'${text}' tidak terdaftar di daftar pesan`
  let _m = conn.serializeM(JSON.parse(JSON.stringify(msgs[text]), (_, v) => {
    if (
      v !== null &&
      typeof v === 'object' &&
      'type' in v &&
      v.type === 'Buffer' &&
      'data' in v &&
      Array.isArray(v.data)) {
      return Buffer.from(v.data)
    }
    return v
  }))
  await _m.copyNForward(m.chat, true)
}
handler.help = ['getvn', 'getmsg', 'getvideo', 'getaudio', 'getimg', 'getsticker', 'getgif']
handler.tags = ['store']
handler.command = ['getvn', 'getmsg', 'getvideo', 'getaudio', 'getimg', 'getsticker', 'getgif']
handler.group = true
module.exports = handler