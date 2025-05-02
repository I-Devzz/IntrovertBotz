/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

let levelling = require(process.cwd() + '/lib/levelling')
module.exports = {
  before(m) {
    let setting = global.db.setting
    let user = global.db.users.find(v => v.jid === m.sender)
    if (!setting.levelup) return !0
    let before = user.level * 1
    while (levelling.canLevelUp(user.level, user.exp, global.multiplier)) user.level++
    if (before !== user.level) {
      m.reply(`Congratulations, you've leveled up!\n*${before}* -> *${user.level}*\nsend *.me* to check`.trim())
    }
  }
}