/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

let handler = m => m
handler.before = async function (m, {
  setting,
  chat,
  users
}) {
  if (m.chat.endsWith('broadcast') || users.banned || m.isBaileys) return
  let msgs = db.msgs
  if (!(m.text in msgs)) return
  let _m = this.serializeM(JSON.parse(JSON.stringify(msgs[m.text]), (_, v) => {
    if (v !== null && typeof v === 'object' && 'type' in v && v.type === 'Buffer' && 'data' in v && Array.isArray(v.data)) {
      return Buffer.from(v.data)
    }
    return v
  }))
  await _m.copyNForward(m.chat, true)
}
module.exports = handler