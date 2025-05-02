/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

let fs = require('fs');

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) return m.reply(`Uhm... teksnya mana?\n\nPenggunaan:\n${usedPrefix + command} <teks>\n\nContoh:\n${usedPrefix + command} menu`);
  
  if (command === 'sf') {
    if (!m.quoted?.text) {
      return m.reply(`Balas pesan yang ingin disimpan!`);
    }
    let path = process.cwd() + `/plugins/${text}.js`;
    try {
      await fs.writeFileSync(path, m.quoted.text);
      m.reply(`Tersimpan di ${path}`);
    } catch (err) {
      m.reply(`Gagal menyimpan file: ${err.message}`);
    }
  } else if (command === 'df') {
    let path = process.cwd() + `/plugins/${text}.js`;
    if (!fs.existsSync(path)) {
      return m.reply(`File plugin ${text}.js tidak ditemukan`);
    }
    try {
      fs.unlinkSync(path);
      m.reply(`File plugin ${text}.js berhasil dihapus`);
    } catch (err) {
      m.reply(`Gagal menghapus file: ${err.message}`);
    }
  }
};

handler.help = ['sf', 'df'].map(v => v + ' <path>');
handler.tags = ['owner'];
handler.command = /^(sf|df)$/i;
handler.rowner = true;

module.exports = handler;
