/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

const machine = new(require(process.cwd() + '/lib/database/localdb'))(global.database)

let handler = async (m, { text, usedPrefix, command }) => {
     await conn.reply(m.chat, Func.texted('bold', 'Restarting . . .'), m).then(async () => {
     await machine.save()
     process.send('reset')
  })
};

handler.help = ['restart']
handler.tags = ['owner'];
handler.command = ['restart']
handler.rowner = true;

module.exports = handler;
