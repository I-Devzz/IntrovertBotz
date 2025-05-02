/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

let handler = async (m, { args, usedPrefix, command, conn, Func }) => {
   try {
      if (!args[0]) {
         return conn.reply(m.chat, Func.example(usedPrefix, command, 'https://chat.whatsapp.com/codeInvite'), m);
      }
      
      let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
      let match = args[0].match(linkRegex);
      if (!match) {
         return conn.reply(m.chat, global.status.invalid, m);
      }

      let code = match[1];
      let id = await conn.groupAcceptInvite(code);
      if (!id || !id.endsWith('g.us')) {
         return conn.reply(m.chat, Func.texted('bold', '🚩 Sorry, I can\'t join this group.'), m);
      }

      await conn.reply(m.chat, '✅ Successfully joined the group!', m);
   } catch (err) {
      console.error(err);
      return conn.reply(m.chat, Func.texted('bold', '🚩 An error occurred, unable to join the group.'), m);
   }
};

handler.help = ['join'];
handler.tags = ['owner'];
handler.command = ['join'];
handler.rowner = true;

module.exports = handler;