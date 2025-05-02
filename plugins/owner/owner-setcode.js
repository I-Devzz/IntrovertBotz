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

let handler = async (m, { args }) => {
  if (!args[0]) return m.reply("Gunakan: .setcode <kode>");
  let data = global.db.redeem
  data.activeCode = args[0];
  data.redeemed = {}; 
  m.reply(`✅ Kode redeem baru berhasil diatur: *${args[0]}*`);
  conn.reply("120363390846847825@newsletter", `*[ NEWS REDEEM-CODE ]*
Pemberitahuan, Redeem Code Terbaru!! Cara meredeemnya dengan cara di bawah ini

*[ Example ]*
.redeem <code>

*[ CODE : \`${args[0]}\` ]*`, null)
};

handler.help = ["setcode <kode>"];
handler.tags = ["owner"];
handler.command = ["setcode"];
handler.owner = true; // Hanya admin yang bisa menggunakan perintah ini

module.exports = handler;