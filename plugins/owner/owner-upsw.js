const fs = require('fs');
const path = require('path');

let handler = async (m, { conn, text }) => {
  try {
    let groups = Object.entries(conn.chats)
      .filter(([jid, chat]) => jid.endsWith('@g.us') && chat.subject)
      .map(([jid, chat]) => ({ jid, name: chat.subject, members: chat.metadata?.participants?.length || 0 }));

    if (!text) {
      if (groups.length === 0) {
        return conn.reply(m.chat, "🚩 Tidak ada grup yang terdeteksi.", m);
      }

      let groupList = groups.map((g, i) => `${i + 1}. ${g.name} (${g.members} anggota)`).join("\n");
      return conn.reply(m.chat, `📋 *Daftar Grup:*\n\n${groupList}`, m);
    }

    let [target, ...captionParts] = text.split("|");
    let caption = captionParts.join(" ").trim();
    let targetJid = null;

    if (!isNaN(target)) {
      let index = parseInt(target) - 1;
      if (index < 0 || index >= groups.length) {
        return conn.reply(m.chat, `🚩 Index grup tidak valid. Pilih 1-${groups.length}.`, m);
      }
      targetJid = groups[index].jid;
    } else if (target.endsWith("@g.us")) {
      targetJid = target;
    } else {
      return conn.reply(m.chat, "🚩 Format tidak valid.\nGunakan:\n• .upsw (lihat daftar grup)\n• .upsw <index>|[caption]\n• .upsw <jid>|[caption]", m);
    }

    if (!caption) {
      let group = groups.find(g => g.jid === targetJid);
      let memberCount = group ? group.members : "Tidak diketahui";
      return conn.reply(m.chat, `📊 *Jumlah anggota di grup ini:* ${memberCount}`, m);
    }

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (mime) {
      if (!/image\/(jpe?g|png)|video\/mp4/.test(mime)) {
        return conn.reply(m.chat, "🚩 Hanya mendukung foto (JPG, PNG) atau video (MP4).", m);
      }

      m.reply(global.status.wait);
      let buffer = await q.download();
      let ext = /image/.test(mime) ? ".jpg" : ".mp4";
      const filepath = path.join(process.cwd(), "temp", `${Date.now()}${ext}`);
      fs.writeFileSync(filepath, buffer);

      if (/image/.test(mime)) {
        await conn.sendStatus([targetJid], { image: { url: filepath }, caption });
      } else {
        await conn.sendStatus([targetJid], { video: { url: filepath }, caption });
      }
    } else {
      await conn.sendStatus([targetJid], { text: caption });
    }

    return conn.reply(m.chat, `✅ Status berhasil dikirim ke grup *${targetJid}*`, m);
  } catch (e) {
    return conn.reply(m.chat, "❌ Terjadi kesalahan:\n" + e.message, m);
  }
};

handler.command = ["upsw"];
handler.tags = ["owner"];
handler.owner = true;

module.exports = handler;
