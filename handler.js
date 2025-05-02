const simple = require('./lib/simple')
const util = require('util')
const moment = require('moment-timezone')
const fs = require('fs')
const chalk = require('chalk')
const cron = require('node-cron')
const autobackup = require('./lib/database-backup')
const isNumber = x => typeof x === 'number' && !isNaN(x)
const fetch = require("node-fetch");
const {
  generateWAMessage,
  areJidsSameUser,
  proto,
} = require("@whiskeysockets/baileys");

require("./config")
module.exports = {
  async handler(chatUpdate) {
    const appenTextMessage = async (text, chatUpdate) => {
      let messages = await generateWAMessage(
        m.chat,
        { text: text, mentions: m.mentionedJid },
        {
          userJid: this.user.id,
          quoted: m.quoted && m.quoted.fakeObj,
        },
      );
      messages.key.fromMe = areJidsSameUser(m.sender, this.user.id);
      messages.key.id = m.key.id;
      messages.pushName = m.pushName;
      if (m.isGroup) messages.participant = m.sender;
      let msg = {
        ...chatUpdate,
        messages: [proto.WebMessageInfo.fromObject(messages)],
        type: "append",
      };
      this.ev.emit("messages.upsert", msg);
    };
    this.msgqueque = this.msgqueque || [];
    if (!chatUpdate) return;
    this.pushMessage(chatUpdate.messages).catch(console.error);
    let m = chatUpdate.messages[chatUpdate.messages.length - 1];
    if (!m) return;
    if (m.message?.viewOnceMessageV2)
      m.message = m.message.viewOnceMessageV2.message;
    if (m.message?.documentWithCaptionMessage)
      m.message = m.message.documentWithCaptionMessage.message;
    if (m.message?.viewOnceMessageV2Extension)
      m.message = m.message.viewOnceMessageV2Extension.message;

    if (!m) return;
    try {
      m = simple.smsg(this, m) || m
      if (!m) return
      // console.log(m)
      m.exp = 0
      m.limit = false
      
      require('./lib/database/schema')(m)
      const groupSet = global.db.groups.find(v => v.jid === m.chat)
      const chats = global.db.chats.find(v => v.jid === m.chat)
      const users = global.db.users.find(v => v.jid === m.sender)
      const setting = global.db.setting
      
      conn.storyJid = conn.storyJid ? conn.storyJid : []
      if (m.chat.endsWith('broadcast') && !conn.storyJid.includes(m.sender) && m.sender != conn.decodeJid(conn.user.id)) conn.storyJid.push(m.sender)
      if (m.chat.endsWith('broadcast') && [...new Set(conn.storyJid)].includes(m.sender) && !/protocol/.test(m.mtype)) {
         await conn.sendMessage('status@broadcast', {
            react: {
               text: Func.random(['🤣', '🥹', '😂', '😋', '😎', '🤓', '🤪', '🥳', '😠', '😱', '🤔']),
               key: m.key
            }
         }, {
            statusJidList: [m.sender]
         })
      }
      
      if (m.isBaileys) return
      if (m.chat.endsWith('broadcast') || m.key.remoteJid.endsWith('broadcast')) return
      
      const isROwner =  [...global.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
      const isPrems = users && users.premium || isROwner

      if (opts['queque'] && m.text && !isPrems) {
        let queque = this.msgqueque, time = 1000 * 5
        const previousID = queque[queque.length - 1]
        queque.push(m.id || m.key.id)
        setInterval(async function () {
          if (queque.indexOf(previousID) === -1) clearInterval(this)
          else await delay(time)
        }, time)
      }

      m.exp += Math.ceil(Math.random() * 10)

      let usedPrefix
      let _user = users

      const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
      const participants = (m.isGroup ? groupMetadata.participants : []) || []
      const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
      const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {}
      const isRAdmin = user && user.admin == 'superadmin' || false
      const isAdmin = isRAdmin || user && user.admin == 'admin' || false
      const isBotAdmin = bot && bot.admin || false
      
      if (!setting.online) conn.sendPresenceUpdate('unavailable', m.chat)
      if (setting.online) {
         conn.sendPresenceUpdate('available', m.chat)
         conn.readMessages([m.key])
      }
      if (m.isGroup && !isBotAdmin) {
         groupSet.localonly = false
      }
      if (!users || typeof users.limit === undefined) return global.db.users.push({
         jid: m.sender,
         banned: false,
         limit: global.limit,
         hit: 0,
         spam: 0
      })
      if (users && (new Date * 1) >= users.expired && users.expired != 0) {
         return conn.reply(users.jid, Func.texted('italic', '🚩 Your premium package has expired, thank you for buying and using our service.')).then(async () => {
            users.premium = false
            users.expired = 0
            users.limit = global.limit
         })
      }
      if (m.isGroup) groupSet.activity = new Date() * 1
      if (users) {
         users.lastseen = new Date() * 1
      }
      if (chats) {
         chats.chat += 1
         chats.lastseen = new Date * 1
      }
      if (m.isGroup && !m.isBot && users && users.afk > -1) {
         conn.reply(m.chat, `You are back online after being offline for : ${Func.texted('bold', Func.toTime(new Date - users.afk))}\n\n• ${Func.texted('bold', 'Reason')}: ${users.afkReason ? users.afkReason : '-'}`, m)
         users.afk = -1
         users.afkReason = ''
      }
        if (m.isGroup && !m.fromMe) {
         let now = new Date() * 1
         if (!groupSet.member[m.sender]) {
            groupSet.member[m.sender] = {
               lastseen: now,
               warning: 0
            }
         } else {
            groupSet.member[m.sender].lastseen = now
         }
      }
      
      for (let name in global.plugins) {
        var plugin;
        if (typeof plugins[name].jihan === "function") {
          var ai = plugins[name];
          plugin = ai.jihan;
          for (var prop in ai) {
            if (prop !== "run") {
              plugin[prop] = ai[prop];
            }
          }
        } else {
          plugin = plugins[name];
        }
        if (!plugin) continue;
        if (plugin.disabled) continue;
        if (typeof plugin.all === "function") {
          try {
            await plugin.all.call(this, m, chatUpdate);
          } catch (e) {
            console.error(e);
          }
        }
                  
        const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
        let match = (_prefix instanceof RegExp ? [[_prefix.exec(m.text), _prefix]] : Array.isArray(_prefix) ? _prefix.map(p => {
              let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
              return [re.exec(m.text), re]
         }) : typeof _prefix === 'string' ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] : [[[], new RegExp]]).find(p => p[1])
        if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
          match, conn: this, participants, groupMetadata, user, Scraper, Func, Key, bot, isROwner, isRAdmin, isAdmin, isBotAdmin, isPrems, users, setting, chatUpdate,
        })) continue
        if (typeof plugin !== 'function') continue
        if ((usedPrefix = (match[0] || '')[0])) {
          let noPrefix = m.text.replace(usedPrefix, '')
          let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
          args = args || []
          let _args = noPrefix.trim().split` `.slice(1)
          let text = _args.join` `
          command = (command || '').toLowerCase()
          let fail = plugin.fail || global.status
          let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) : Array.isArray(plugin.command) ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) : typeof plugin.command === 'string' ? plugin.command === command : false
          if (!isAccept) continue
                      
          m.command = command;
          m.plugin = name;
          if (plugin && command) {
            users.hit += 1;
            users.usebot = new Date().getTime();
            Func.hitstat(command, m.sender);
          }
          if (!isROwner && users.banned) {
           m.reply(global.status.banned);
           continue;
          }
          if (plugin.rowner && plugin.owner && !(isROwner)) { // Both Owner
            m.reply(global.status.owner)
            continue
          }
          if (plugin.owner && !isROwner) { // Number Owner
            m.reply(global.status.owner)
            continue
          }
          if (plugin.premium && !isPrems) { // Premium
            m.reply(global.status.premium)
            continue
          }
          if (plugin.limit && users.limit < 1) {
               m.reply(`⚠️ You reached the limit and will be reset at 00.00\n\nTo get more limits upgrade to premium plans.`).then(() => users.premium = false)
               continue
            }
          if (plugin.group && !m.isGroup) { // Group Only
            m.reply(global.status.group)
            continue
          }
          if (plugin.botAdmin && !isBotAdmin) { // You Admin
            m.reply(global.status.botAdmin)
            continue
          } else if (plugin.admin && !isAdmin) { // User Admin
            m.reply(global.status.admin)
            continue
          }
          if (plugin.private && m.isGroup) { // Private Chat Only
            m.reply(global.status.private)
            continue
           }
          if (plugin.register && !users.registered) {
            conn.replyButton(m.chat, [{ text: 'Join As User', command: `${usedPrefix}daftar Zoldycl-${Func.makeId(5)}.${Func.randomInt(13, 30)}`}], m, {
            text: global.status.register,
            footer: global.set.footer
          })   
            continue;
          }
          if (m.isGroup && name != "group-mute.js" && !isAdmin && groupSet.mute) return;
          m.isCommand = true
          let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
          if (xp > 200) m.reply('Ngecit -_-') // Hehehe
          else m.exp += xp
         if (plugin.level > _user.level) {
            this.reply(m.chat, `diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user.level}`, m)
            continue // If the level has not been reached
          }
          let extra = {
            match, usedPrefix, noPrefix, _args, args, command, text, conn: this, Func, Key, participants, Scraper, groupMetadata, user, bot, isROwner, isRAdmin, isAdmin, isBotAdmin, isPrems, groupSet, users, setting, chatUpdate,
          }
          try {
            await plugin.call(this, m, extra)
            if (!isPrems) m.limit = m.limit || plugin.limit || true;
          } catch (e) {
            m.error = e
            console.error(e)
            if (e) {
                let text = Func.jsonFormat(e)
               conn.reply('6285133663664@s.whatsapp.net', `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``.trim(), m)
               m.reply(text)
            }
          } finally {
            if (typeof plugin.after === 'function') {
              try {
                await plugin.after.call(this, m, extra)
              } catch (e) {
                console.error(e)
              }
            }
          }
          break
       }
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (opts['queque'] && m.text) {
        const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
        if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
       }
       
      let user = global.db.users.find(v => v.jid === m.sender), stats = db.statistic
      if (m) {
        if (m.sender && user) {
          user.exp += m.exp
          user.limit -= m.limit * 1
        }

        let stat
        if (m.plugin) {
          let now = + new Date
          if (m.plugin in stats) {
            stat = stats[m.plugin]
            if (!isNumber(stat.total)) stat.total = 1
            if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
            if (!isNumber(stat.last)) stat.last = now
            if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
          } else stat = stats[m.plugin] = {
            total: 1,
            success: m.error != null ? 0 : 1,
            last: now,
            lastSuccess: m.error != null ? 0 : now
          }
          stat.total += 1
          stat.last = now
          if (m.error == null) {
            stat.success += 1
            stat.lastSuccess = now
          }
        }
      }
      
      try {
        require('./lib/print')(m, this)
      } catch (e) {
        console.log(m, m.quoted, e)
      }
       await this.readMessages([m.key])
    }
  },
  async participantsUpdate({ id, participants, action }) {
    let chat = global.db.groups.find(v => v.jid === id) || {}
    let setting = global.db.setting
    let text = ''
    switch (action) {
      case 'add':
      case 'remove':
      case 'leave':
      case 'invite':
      case 'invite_v4':
        if (chat.welcome) {
          let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
          for (let user of participants) {
            let pp = await this.profilePictureUrl(user, "image").catch((e) => "https://telegra.ph/file/88871a1e52633d9ae6f45.jpg");
              text = (action === 'add' ? (setting.text_welcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc.toString()) :
                (setting.text_left || this.bye || conn.bye || 'Bye, @user!')).replace('@user', '@' + user.split('@')[0]).replace('@subject', await this.getName(id))
              this.sendMessageModify(id, text, null, {
                largeThumb: true,
                thumbnailUrl: pp,
                url: global.db.setting.link
              })
          }
        }
        break
      case 'promote':
          text = (setting.promote || this.spromote || conn.spromote || '@user ```is now Admin```')
      case 'demote':
        if (!text)
          text = (setting.demote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
          text = text.replace('@user', '@' + participants[0].split('@')[0])
        if (chat.detect)
          this.reply(id, text, null)
        break
    }
  },
  async delete(message) {
    try {
      const { fromMe, id, participant } = message
      if (fromMe) return
      let chats = Object.entries(conn.chats).find(([_, data]) => data.messages?.[id])
      if (!chats) return
      let msg = chats instanceof String ? JSON.parse(chats[1].messages[id]) : chats[1].messages[id]
      let chat = global.db.groups.find(v => v.jid === msg.key.remoteJid) || {}
      if (chat.delete) return
      await this.reply(msg.key.remoteJid, `
Terdeteksi @${participant.split`@`[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.off antidelete*
`.trim(), msg)
      this.copyNForward(msg.key.remoteJid, msg).catch(e => console.log(e, msg))
    } catch (e) {
      console.error(e)
     }
    },
   async groupsUpdate(groupsUpdate) {
    for (const groupUpdate of groupsUpdate) {
        const id = groupUpdate.id
        if (!id) continue
        let chats = global.db.groups.find(v => v.jid === id), text = ''
        if (!chats?.detect) continue
        if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || this.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc)
        // if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || this.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject)
        if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || this.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon)
        if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || this.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke)
        if (!text) continue
        await this.sendMessage(id, { text: text })
    }
  },
}

autobackup(conn)


let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'handler.js'"))
  delete require.cache[file]
  if (global.reloadHandler) console.log(global.reloadHandler())
})