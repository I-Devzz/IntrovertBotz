module.exports = {
  async all(m) {
    if (!m.isGroup) return
    let chats = global.db.groups.find(v => v.jid === m.chat)
    if (!chats.expired) return !0
    if (+new Date() > chats.expired) {
      await m.reply('The active rental period in this group has expired, the bot will leave the group, if you want to rent again, please contact the Owner.')
      chats.expired = 0
      let nomor = global.owner;
      let array = [];
      for (let i of nomor) {
         let jid = await (await this.onWhatsApp(i))[0].jid;
         let nama = await this.getName(i + "@s.whatsapp.net");
        array.push([i, nama]);
      }
      await this.sendContact(m.chat, array, m)
      await this.delay(10000)
      await this.groupLeave(m.chat)
    }
  },
}