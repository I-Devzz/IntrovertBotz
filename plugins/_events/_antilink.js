let handler = (m) => m;

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
handler.before = async function (m, { user, isBotAdmin, isAdmin }) {
  if ((m.isBaileys && m.fromMe) || m.fromMe || !m.isGroup) return;
  let chat = global.db.groups.find(v => v.jid === m.chat)
  let isGroupLink = linkRegex.exec(m.text);
  if (isAdmin) return;
  if (!isBotAdmin) return;
  if (chat.antilink && isGroupLink) {
    await m.reply(`*[ System Detected ]* you send another link group, i will delete this`);
    let linkGC = "https://chat.whatsapp.com/" + (await conn.groupInviteCode(m.chat));
    let isLinkconnGc = new RegExp(linkGC, "i");
    let isgclink = isLinkconnGc.test(m.text);
    if (isgclink) return;
    await conn.sendMessage(m.chat, { delete: m.key });
    await this.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant,
      },
    });
  }
  return true;
};

module.exports = handler;
