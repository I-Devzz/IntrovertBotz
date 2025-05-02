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

let handler = async (m, { conn, text, usedPrefix, command }) => {
      try {
         let input = text ? text : m.quoted ? m.quoted.sender : m.mentionedJid.length > 0 ? m.mentioneJid[0] : false
         if (!input) return conn.reply(m.chat, Func.texted('bold', `🚩 Mention or reply chat target.`), m)
         let p = await conn.onWhatsApp(input.trim())
         if (p.length == 0) return conn.reply(m.chat, Func.texted('bold', `🚩 Invalid number.`), m)
         let jid = conn.decodeJid(p[0].jid)
         let number = jid.replace(/@.+/, '')
         if (command == '+owner') { // add owner number
            let owners = global.db.setting.owners
            if (owners.includes(number)) return conn.reply(m.chat, Func.texted('bold', `🚩 Target is already the owner.`), m)
            owners.push(number)
            conn.reply(m.chat, Func.texted('bold', `🚩 Successfully added @${number} as owner.`), m)
         } else if (command == '-owner') { // remove owner number
            let owners = global.db.setting.owners
            if (!owners.includes(number)) return conn.reply(m.chat, Func.texted('bold', `🚩 Target is not owner.`), m)
            owners.forEach((data, index) => {
               if (data === number) owners.splice(index, 1)
            })
            conn.reply(m.chat, Func.texted('bold', `🚩 Successfully removing @${number} from owner list.`), m)
         } else if (command == '-prem') { // remove premium
            let data = global.db.users.find(v => v.jid == jid)
            if (typeof data == 'undefined') return conn.reply(m.chat, Func.texted('bold', `🚩 Can't find user data.`), m)
            if (!data.premium) return conn.reply(m.chat, Func.texted('bold', `🚩 Not a premium account.`), m)
            data.limit = global.limit
            data.premium = false
            data.expired = 0
            conn.reply(m.chat, Func.texted('bold', `🚩 @${jid.replace(/@.+/, '')}'s premium status has been successfully deleted.`), m)
         } else if (command == 'block') { // block user
            if (jid == conn.decodeJid(conn.user.id)) return conn.reply(m.chat, Func.texted('bold', `🚩 ??`), m)
            conn.updateBlockStatus(jid, 'block').then(() => m.reply(`Berhasil Memblockir ${jid.split("@")[0]}`))
         } else if (command == 'unblock') { // unblock user
            conn.updateBlockStatus(jid, 'unblock').then(() => m.reply(`Berhasil Membuka Blockir ${jid.split("@")[0]}`))
         } else if (command == 'ban') { // banned user
            let is_user = global.db.users
            let is_owner = [conn.decodeJid(global.conn.user.id), ...global.owner.map((a) => a + "@s.whatsapp.net")].includes(jid);
            if (!is_user.some(v => v.jid == jid)) return conn.reply(m.chat, Func.texted('bold', `🚩 User data not found.`), m)
            if (is_owner) return conn.reply(m.chat, Func.texted('bold', `🚩 Can't banned owner number.`), m)
            if (jid == conn.decodeJid(conn.user.id)) return conn.reply(m.chat, Func.texted('bold', `🚩 ??`), m)
            if (is_user.find(v => v.jid == jid).banned) return conn.reply(m.chat, Func.texted('bold', `🚩 Target already banned.`), m)
            is_user.find(v => v.jid == jid).banned = true
            let banned = is_user.filter(v => v.banned).length
            conn.reply(m.chat, `乂  *B A N N E D*\n\n*“Successfully added @${jid.split`@`[0]} into banned list.”*\n\n*Total : ${banned}*`, m)
         } else if (command == 'unban') { // unbanned user
            let is_user = global.db.users
            if (!is_user.some(v => v.jid == jid)) return conn.reply(m.chat, Func.texted('bold', `🚩 User data not found.`), m)
            if (!is_user.find(v => v.jid == jid).banned) return conn.reply(m.chat, Func.texted('bold', `🚩 Target not banned.`), m)
            is_user.find(v => v.jid == jid).banned = false
            let banned = is_user.filter(v => v.banned).length
            conn.reply(m.chat, `乂  *U N B A N N E D*\n\n*“Succesfully removing @${jid.split`@`[0]} from banned list.”*\n\n*Total : ${banned}*`, m)
         }
      } catch (e) {
         conn.reply(m.chat, Func.jsonFormat(e), m)
      }
};
handler.help = ['+owner', '-owner', '-prem', 'block', 'unblock', 'ban', 'unban']
handler.tags = ["owner"];
handler.command = ['+owner', '-owner', '-prem', 'block', 'unblock', 'ban', 'unban'];
handler.owner = true
module.exports = handler;