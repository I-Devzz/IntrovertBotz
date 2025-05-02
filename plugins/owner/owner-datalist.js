/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

let handler = async (m, { text, usedPrefix, command }) => {
      if (command === 'listban') {
      const data = global.db.users.filter(v => v.banned)
      if (data.length < 1) return m.reply(Func.texted('bold', `📮 Data kosong.`))
      let text = `乂 *L I S T B A N*\n\n`
      text += data.map((v, i) => {
        if (i == 0) {
          return `┌  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')}`
        } else if (i == data.length - 1) {
          return `└  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')}`
        } else {
          return `│  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')}`
        }
      }).join('\n')
      m.reply(text + '\n\n' + global.set.footer)
    } else if (command === 'listprem') {
      const data = global.db.users.filter(v => v.premium)
      if (data.length < 1) return m.reply(Func.texted('bold', `📮 Data kosong.`))
      let text = `乂 *L I S T P R E M*\n\n`
      text += data.map((v, i) => {
        if (i == 0) {
          return `┌  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')} (${v.expired == 0 ? '-' : Func.timeReverse(v.expired - new Date() * 1)})`
        } else if (i == data.length - 1) {
          return `└  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')} (${v.expired == 0 ? '-' : Func.timeReverse(v.expired - new Date() * 1)})`
        } else {
          return `│  ◦  @${conn.decodeJid(v.jid).replace(/@.+/, '')} (${v.expired == 0 ? '-' : Func.timeReverse(v.expired - new Date() * 1)})`
        }
      }).join('\n')
      m.reply(text + '\n\n' + global.set.footer)
    }
};

handler.help = ['listban', 'listprem']
handler.tags = ['owner'];
handler.command = ['listban', 'listprem']
handler.rowner = true;

module.exports = handler;