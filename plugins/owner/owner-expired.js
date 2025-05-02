let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!args[0])
    return m.reply(`Masukkan angka mewakili jumlah hari atau format: jid|jumlah hari!\n\nContoh:\n${usedPrefix + command} 30\natau\n${usedPrefix + command} 120363270286912929@g.us|30`);

  let timeArg, who;
  if (args[0].includes("|")) {
    let [jid, t] = args[0].split("|");
    who = jid.trim();
    timeArg = t.trim();
  } else {
    timeArg = args[0];
    if (m.isGroup) {
      who = args[1] ? args[1] : m.chat;
    } else {
      who = args[1];
    }
  }

  if (isNaN(timeArg))
    return m.reply(
      `Masukkan angka mewakili jumlah hari!\n\nContoh:\n${usedPrefix + command} 30`
    );

  let jumlahHari = 86400000 * Number(timeArg);
  let now = Date.now();

  // Cari data grup menggunakan model database baru
  let group = global.db.groups.find(v => v.jid === who);
  if (!group) {
    group = { jid: who, expired: 0 };
    global.db.groups.push(group);
  }

  if (now < group.expired) {
    group.expired += jumlahHari;
  } else {
    group.expired = now + jumlahHari;
  }

  // Coba dapatkan nama dari kontak/grup, jika tidak ada gunakan jid itu sendiri
  let name = await conn.getName(who);
  if (!name) name = who;

  conn.reply(m.chat, `Berhasil menetapkan hari kedaluwarsa untuk ${name} selama ${timeArg} hari.\n\nHitung Mundur : ${Func.toDate(group.expired - now)}`, m);
};

handler.help = handler.command = ["expired"];
handler.tags = ["owner"];
handler.owner = true;
handler.fail = null;
module.exports = handler;
