const {
  default: makeWASocket,
  makeWALegacySocket,
  extractMessageContent,
  makeInMemoryStore,
  proto,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  getBinaryNodeChild,
  jidDecode,
  generateWAMessage,
  areJidsSameUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  WA_DEFAULT_EPHEMERAL,
} = require("@whiskeysockets/baileys");
const chalk = require("chalk");
const fetch = require("node-fetch");
const FileType = require("file-type");
const PhoneNumber = require("awesome-phonenumber");
const fs = require("fs");
const path = require("path");
let Jimp = require("jimp");
const pino = require("pino");
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});
const {
  toAudio,
  toPTT,
  toVideo
} = require('./converter')
const Exif = new(require('./exif'))

const ephemeral = { ephemeralExpiration: 8600 };

exports.makeWASocket = (connectionOptions, options = {}) => {
  let conn = (global.opts["legacy"] ? makeWALegacySocket : makeWASocket)(
    connectionOptions,
  );  
  conn.loadAllMessages = (messageID) => {
    return Object.entries(conn.chats)
      .filter(([_, { messages }]) => typeof messages === "object")
      .find(([_, { messages }]) =>
        Object.entries(messages).find(
          ([k, v]) => k === messageID || v.key?.id === messageID,
        ),
      )?.[1].messages?.[messageID];
  };

  conn.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return (
        (decode.user && decode.server && decode.user + "@" + decode.server) ||
        jid
      );
    } else return jid;
  };
  if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id);
  if (!conn.chats) conn.chats = {};

  function updateNameToDb(contacts) {
    if (!contacts) return;
    for (const contact of contacts) {
      const id = conn.decodeJid(contact.id);
      if (!id) continue;
      let chats = conn.chats[id];
      if (!chats) chats = conn.chats[id] = { id };
      conn.chats[id] = {
        ...chats,
        ...({
          ...contact,
          id,
          ...(id.endsWith("@g.us")
            ? { subject: contact.subject || chats.subject || "" }
            : { name: contact.notify || chats.name || chats.notify || "" }),
        } || {}),
      };
    }
  }

  conn.ev.on("contacts.upsert", updateNameToDb);
  conn.ev.on("groups.update", updateNameToDb);
  conn.ev.on("chats.set", async ({ chats }) => {
    for (const { id, name, readOnly } of chats) {
      id = conn.decodeJid(id);
      if (!id) continue;
      const isGroup = id.endsWith("@g.us");
      let chats = conn.chats[id];
      if (!chats) chats = conn.chats[id] = { id };
      chats.isChats = !readOnly;
      if (name) chats[isGroup ? "subject" : "name"] = name;
      if (isGroup) {
        const metadata = await conn.groupMetadata(id).catch((_) => null);
        if (!metadata) continue;
        chats.subject = name || metadata.subject;
        chats.metadata = metadata;
      }
    }
   })
  conn.ev.on("group-participants.update", async function updateParticipantsToDb({ id, participants, action }) {
      id = conn.decodeJid(id);
      if (!(id in conn.chats)) conn.chats[id] = { id };
      conn.chats[id].isChats = true;
      const groupMetadata = await conn.groupMetadata(id).catch((_) => null);
      if (!groupMetadata) return;
      conn.chats[id] = {
        ...conn.chats[id],
        subject: groupMetadata.subject,
        metadata: groupMetadata,
      };
    },
  );

  conn.ev.on("groups.update", async function groupUpdatePushToDb(groupsUpdates) {
      for (const update of groupsUpdates) {
        const id = conn.decodeJid(update.id);
        if (!id) continue;
        const isGroup = id.endsWith("@g.us");
        if (!isGroup) continue;
        let chats = conn.chats[id];
        if (!chats) chats = conn.chats[id] = { id };
        chats.isChats = true;
        const metadata = await conn.groupMetadata(id).catch((_) => null);
        if (!metadata) continue;
        chats.subject = metadata.subject;
        chats.metadata = metadata;
      }
    },
  );
  conn.ev.on("chats.upsert", async function chatsUpsertPushToDb(chatsUpsert) {
    console.log({ chatsUpsert });
    const { id, name } = chatsUpsert;
    if (!id) return;
    let chats = (conn.chats[id] = {
      ...conn.chats[id],
      ...chatsUpsert,
      isChats: true,
    });
    const isGroup = id.endsWith("@g.us");
    if (isGroup) {
      const metadata = await conn.groupMetadata(id).catch((_) => null);
      if (metadata) {
        chats.subject = name || metadata.subject;
        chats.metadata = metadata;
      }
      const groups =
        (await conn.groupFetchAllParticipating().catch((_) => ({}))) || {};
      for (const group in groups)
        conn.chats[group] = {
          id: group,
          subject: groups[group].subject,
          isChats: true,
          metadata: groups[group],
        };
    }
  });
  conn.ev.on("presence.update", async function presenceUpdatePushToDb({ id, presences }) {
      const sender = Object.keys(presences)[0] || id;
      const _sender = conn.decodeJid(sender);
      const presence = presences[sender]["lastKnownPresence"] || "composing";
      let chats = conn.chats[_sender];
      if (!chats) chats = conn.chats[_sender] = { id: sender };
      chats.presences = presence;
      if (id.endsWith("@g.us")) {
        let chats = conn.chats[id];
        if (!chats) {
          const metadata = await conn.groupMetadata(id).catch((_) => null);
          if (metadata)
            chats = conn.chats[id] = {
              id,
              subject: metadata.subject,
              metadata,
            };
        }
        chats.isChats = true;
      }
    },
  );

  conn.logger = {
    ...conn.logger,
    info(...args) {
      console.log(chalk.bold.rgb(57, 183, 16)(`INFO [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.cyan(...args));
    },
    error(...args) {
      console.log(chalk.bold.rgb(247, 38, 33)(`ERROR [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.rgb(255, 38, 0)(...args));
    },
    warn(...args) {
      console.log(chalk.bold.rgb(239, 225, 3)(`WARNING [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.keyword("orange")(...args));
    },
  };

  conn.appendTextMessage = async (m, text, chatUpdate) => {
    let messages = await generateWAMessage(
      m.chat,
      {
        text: text,
        mentions: m.mentionedJid,
      },
      {
        userJid: conn.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
      },
    );
    messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;
    let msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: "append",
    };
    conn.ev.emit("messages.upsert", msg);
    return m;
  };

  /**
   * getBuffer hehe
   * @param {fs.PathLike} path
   * @param {Boolean} returnFilename
   */
  conn.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    const data = Buffer.isBuffer(PATH)
      ? PATH
      : /^data:.*?\/.*?;base64,/i.test(PATH)
        ? Buffer.from(PATH.split`,`[1], "base64")
        : /^https?:\/\//.test(PATH)
          ? await (res = await fetch(PATH)).buffer()
          : fs.existsSync(PATH)
            ? ((filename = PATH), fs.readFileSync(PATH))
            : typeof PATH === "string"
              ? PATH
              : Buffer.alloc(0);
    if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");
    const type = (await FileType.fromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };
    if (data && returnAsFilename && !filename)
      (filename = path.join(
        __dirname,
        "../temp/" + new Date() * 1 + "." + type.ext,
      )),
        await fs.promises.writeFile(filename, data);
    return {
      res,
      filename,
      ...type,
      data,
      deleteFile() {
        return filename && fs.promises.unlink(filename);
      },
    };
  };
conn.replyButton = async (jid, buttons = [], quoted, options = {}, context = {}) => {
  // Prepare button data
  let buttonData = [];
  for (const button of buttons) {
    if (button?.name) {
      buttonData.push({
        nativeFlowInfo: {
          name: button.name,
          paramsJson: JSON.stringify(button.param)
        },
        type: "NATIVE_FLOW"
      });
    } else {
      buttonData.push({
        buttonId: button.command,
        buttonText: {
          displayText: button.text
        },
        type: "RESPONSE"
      });
    }
  }

  // Prepare media
  let mediaMessage = {};
  if (options?.media) {
    let mediaFile;
    if (/^(http|https):\/\/.*/.test(options.media)) {
      mediaFile = await Func.getFile(options.media);
    } else {
      mediaFile = await Func.getFile(options.media);
    }
    if (options?.document) {
      const documentMessage = await prepareWAMessageMedia({
        document: {
          url: mediaFile.file
        },
        fileName: options?.document?.filename || mediaFile.filename,
        mimetype: mediaFile.mime
      }, {
        upload: conn.waUploadToServer
      });
      mediaMessage = { documentMessage: documentMessage.documentMessage };
    } else if (/image/.test(mediaFile.mime)) {
      if (options?.location) {
        mediaMessage = {
          locationMessage: {
            thumbnail: await Func.createThumb(options.media)
          }
        };
      } else {
        const imageMessage = await prepareWAMessageMedia({
          image: {
            url: mediaFile.file
          }
        }, {
          upload: conn.waUploadToServer
        });
        mediaMessage = { imageMessage: imageMessage.imageMessage };
      }
    } else if (/video/.test(mediaFile.mime)) {
      const videoMessage = await prepareWAMessageMedia({
        video: {
          url: mediaFile.file
        }
      }, {
        upload: conn.waUploadToServer
      });
      mediaMessage = { videoMessage: videoMessage.videoMessage };
    }
  }

  const messageContent = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 0x2
        },
        buttonsMessage: {
          ...mediaMessage,
          contentText: options?.text || '',
          footerText: options?.footer || '',
          contextInfo: {
            mentionedJid: conn.parseMention(options?.text || ''),
            ...context
          },
          buttons: buttonData,
          headerType: mediaMessage?.imageMessage ? "IMAGE" : mediaMessage?.videoMessage ? "VIDEO" : mediaMessage?.documentMessage ? "DOCUMENT" : "EMPTY"
        }
      }
    }
  }, {
    userJid: conn.user.jid,
    quoted: quoted
  });

  await conn.sendPresenceUpdate("composing", jid);
  conn.relayMessage(jid, messageContent.message, {
    messageId: messageContent.key.id
  });

  return messageContent;
  };
  conn.sendIAMessage = async (jid, buttons = [], quoted, options = {}, context = {}) => {
      if (options.media) {
        var mediaFile = await Func.getFile(options.media);
        if (/image/.test(mediaFile.mime)) {
          var Doc = await prepareWAMessageMedia({
            image: {
              url: mediaFile.file
            }
          }, {
            upload: conn.waUploadToServer
          });
          var Messagess = {
            imageMessage: Doc.imageMessage
          };
        } else {
          if (/video/.test(mediaFile.mime)) {
            var Doc = await prepareWAMessageMedia({
              video: {
                url: mediaFile.file
              }
            }, {
              upload: conn.waUploadToServer
            });
            var Messagess = {
              videoMessage: Doc.videoMessage
            };
          } else {
            var Messagess = {};
          }
        }
      }
      const M = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 0x2
            },
            interactiveMessage: {
              header: proto.Message.InteractiveMessage.create({
                title: options.header ? options.header : '',
                subtitle: options.subtitle ? options.subtitle : '',
                hasMediaAttachment: !!(options.media && /image|video/.test(mediaFile.mime)),
                ...Messagess
              }),
              body: proto.Message.InteractiveMessage.create({
                text: options.content ? options.content : ''
              }),
              footer: proto.Message.InteractiveMessage.create({
                text: options.footer ? options.footer : ''
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.create({
                buttons: buttons,
                messageParamsJson: ''
              }),
              contextInfo: {
                mentionedJid: conn.parseMention(options.content ? options.content : ''),
                ...context
              }
            }
          }
        }
      }, {
         userJid: conn.user.jid,
         quoted: quoted
      });
    await conn.sendPresenceUpdate("composing", jid);
    conn.relayMessage(jid, M.message, {
        messageId: M.key.id
    });
    return M;
  };
conn.sendStatus = async (jids, content) => {
  const colors = [
    "#7ACAA7",
    "#6E257E",
    "#5796FF",
    "#7E90A4",
    "#736769",
    "#57C9FF",
    "#25C3DC",
    "#FF7B6C",
    "#55C265",
    "#FF898B",
    "#8C6991",
    "#C69FCC",
    "#B8B226",
    "#EFB32F",
    "#AD8774",
    "#792139",
    "#C1A03F",
    "#8FA842",
    "#A52C71",
    "#8394CA",
    "#243640"
  ];
  const fonts = [0, 1, 2, 6, 7, 8, 9, 10];

  const fetchParticipants = async (...jids) => {
    let results = [];
    for (const jid of jids) {
      const { participants } = await conn.groupMetadata(jid);
     results = results.concat(participants.map(({ id }) => id));
    }
    return results;
  };

  const statusJidList = [
    ...new Set(
      (
        await Promise.all(
          jids.map(async (jid) =>
            jid.endsWith("@g.us") ? await fetchParticipants(jid) : [jid]
          )
        )
      ).flat()
    )
  ];

  await conn.sendMessage("status@broadcast", content, {
    backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    font: fonts[Math.floor(Math.random() * fonts.length)],
    statusJidList,
    additionalNodes: [
      {
        tag: "meta",
        attrs: {},
        content: [
          {
            tag: "mentioned_users",
            attrs: {},
            content: jids.map((jid) => ({
              tag: "to",
              attrs: { jid },
              content: undefined
            }))
          }
        ]
      }
    ]
   });
  };
  conn.sendCarousel = async (jid, cards = [], quoted, options = {}) => {
      let card = [];
      for (const carding of cards) {
        var mediaFile = await Func.getFile(carding.header.imageMessage);
        var FileMessage = await prepareWAMessageMedia({
          image: {
            url: mediaFile.file
          }
        }, {
          upload: conn.waUploadToServer
        });
        card.push({
          header: {
            imageMessage: FileMessage.imageMessage,
            hasMediaAttachment: true
          },
          body: carding.body,
          nativeFlowMessage: carding.nativeFlowMessage
        });
      }
      const w = generateWAMessageFromContent(jid, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: {
                text: options.content ? options.content : ''
              },
              carouselMessage: {
                cards: card,
                messageVersion: 0x1
              },
              footer: {
                text: options.footer ? options.footer : ''
              }
            }
          }
        }
      }, {
        userJid: conn.user.jid,
        quoted: quoted
      });
      conn.relayMessage(jid, w.message, {
        messageId: w.key.id
      });
     return w;
  };
    
  conn.sendProcess = async (jid, text, quoted) => {
      const b = ["⬢⬡⬡⬡⬡⬡⬡⬡⬡⬡ 10%", "⬢⬢⬢⬡⬡⬡⬡⬡⬡⬡ 30%", "⬢⬢⬢⬢⬢⬡⬡⬡⬡⬡ 50%", "⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢ 100%", text];
      conn.reply(jid, "⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡ 0%", quoted).then(async i => {
        for (let e of b) {
          await Func.delay(1000);
          conn.relayMessage(jid, {
            protocolMessage: {
              key: i.key,
              type: 0xe,
              editedMessage: {
                conversation: e
              }
            }
          }, {});
        }
      });
   };
   
   conn.sendReact = async (jid, text, quoted) => {
     let reactionMessage = {
         react: {
            text: text,
            key: quoted
         }
      };
      return await conn.sendMessage(jid, reactionMessage);
   };
   
  conn.sendProcessV2 = async (jid, processArray, quoted) => {
  conn.reply(jid, "Please Wait A Minutes", quoted).then(async i => {
    for (let e of processArray) {
      for (let txt of e.text) {  // If text is an array, we loop through each text
        await Func.delay(e.delay);  // Wait for the specified delay
        conn.relayMessage(jid, {
          protocolMessage: {
            key: i.key,
            type: 0xe,
            editedMessage: {
              conversation: txt
            }
          }
        }, {});
      }
    }
   });
  };
  
  conn.sendDocument = async (jid, url, mime, filename, text, quoted) => {
  if (!url || !mime || !filename) {
    throw new Error("Parameter url, mime, dan filename harus disertakan");
  }
  await conn.sendMessage(jid, { document: { url }, mimetype: mime, fileName: filename, caption: text }, { quoted });
  };
   
  conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
    let type = await conn.getFile(path, true)
    let { res, data: file, filename: pathFile } = type
    if (res && res.status !== 200 || file.length <= 65536) {
      try {
        throw {
          json: JSON.parse(file.toString())
        }
      } catch (e) {
        if (e.json) throw e.json
      }
    }
    let opt = { filename }
    if (quoted) opt.quoted = quoted
    if (!type) options.asDocument = true
    let mtype = '',
      mimetype = type.mime,
      convert
    if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker'
    else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image'
    else if (/video/.test(type.mime)) mtype = 'video'
    else if (/audio/.test(type.mime)) (convert = await (ptt ? toPTT : toAudio)(file, type.ext), file = convert.data, pathFile = convert.filename, mtype = 'audio', mimetype = 'audio/ogg; codecs=opus')
    else mtype = 'document'
    if (options.asDocument) mtype = 'document'

    delete options.asSticker
    delete options.asLocation
    delete options.asVideo
    delete options.asDocument
    delete options.asImage

    let message = {
      ...options,
      caption,
      ptt,
      [mtype]: {
        url: pathFile
      },
      mimetype
    }
    let m
    try {
      m = await conn.sendMessage(jid, message, {
        ...opt,
        ...options
      })
    } catch (e) {
      console.error(e)
      m = null
    } finally {
      if (!m) m = await conn.sendMessage(jid, {
        ...message,
        [mtype]: file
      }, {
        ...opt,
        ...options
      })
      return m
    }
  }
   
   conn.sendAudio = async (jid, data, quoted = '') => {
    return conn.sendMessage(jid, { audio: { url: data }, mimetype: "audio/mp4" }, { quoted });
   };

  (conn.sendContact = async (jid, data, quoted, options) => {
    if (!Array.isArray(data[0]) && typeof data[0] === "string") data = [data];
    let contacts = [];
    for (let [number, name] of data) {
      number = number.replace(/[^0-9]/g, "");
      let njid = number + "@s.whatsapp.net";
      let biz = (await conn.getBusinessProfile(njid).catch((_) => null)) || {};
      let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, "\\n")}
ORG:
item1.TEL;waid=${number}:${PhoneNumber("+" + number).getNumber("international")}
item1.X-ABLabel:Ponsel${biz.description? `item2.EMAIL;type=INTERNET:${(biz.email || "").replace(/\n/g, "\\n")}
item2.X-ABLabel:Email
PHOTO;BASE64:${((await conn.getFile(await conn.profilePictureUrl(njid)).catch((_) => ({}))) || {}).number?.toString("base64")}
X-WA-BIZ-DESCRIPTION:${(biz.description || "").replace(/\n/g, "\\n")}
X-WA-BIZ-NAME:${name.replace(/\n/g, "\\n")}`: ""}
END:VCARD`.trim();
      contacts.push({ vcard, displayName: name });
    }
    return conn.sendMessage(jid, { ...options, contacts: { ...options, displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null, contacts }}, { quoted, ...options });
    enumerable: true;
  }),
  
  conn.reply = async (jid, text, quoted, options) => {
     await conn.sendPresenceUpdate('composing', jid)
     return conn.sendMessage(jid, {text: text, mentions: conn.parseMention(text), ...options}, { quoted})
  }

  conn.resize = async (image, width, height) => {
    let oyy = await Jimp.read(image);
    let kiyomasa = await oyy.resize(width, height).getBufferAsync(Jimp.MIME_JPEG);
    return kiyomasa;
  };

  conn.sendMessageModify = async (chatId, message, chatContext, opts) => {
  if (opts) {
    opts.renderLargerThumbnail = opts.largeThumb || opts.renderLargerThumbnail;
    opts.showAdAttribution = opts.ads || opts.showAdAttribution;
    opts.sourceUrl = opts.url || global.db.setting.link;

    delete opts.largeThumb;
    delete opts.ads;
    delete opts.url;
  }

  opts.thumbnailUrl = opts.thumbnailUrl || global.db.setting.cover;

  conn.reply(chatId, message, chatContext, {
    contextInfo: {
      mentionedJid: conn.parseMention(message),
      groupMentions: [],
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
            newsletterJid: global.saluran,
            newsletterName: "⚠️ Please Follow For Information",
            serverMessageId: -1
      },
      externalAdReply: {
        title: global.botnet,
        mediaType: 1,
        previewType: 0,
        ...opts
      }
    }
   });
  };
  
  conn.sendGroupV4Invite = async (jid, participant, inviteCode, inviteExpiration, groupName = "unknown subject", caption = "Invitation to join my WhatsApp group", options = {}) => {
    let msg = proto.Message.fromObject({
      groupInviteMessage: proto.GroupInviteMessage.fromObject({
        inviteCode,
        inviteExpiration: parseInt(inviteExpiration) || +new Date(new Date() + 3 * 86400000),
        groupJid: jid,
        groupName: groupName ? groupName : this.getName(jid),
        caption,
      }),
    });
    let message = await this.prepareMessageFromContent(participant, msg, options);
    await this.relayWAMessage(message);
    return message;
  };

  conn.cMod = (jid, message, text = "", sender = conn.user.jid, options = {}) => {
    let copy = message.toJSON();
    let mtype = Object.keys(copy.message)[0];
    let isEphemeral = false;
    if (isEphemeral) {
      mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
    }
    let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
    let content = msg[mtype];
    if (typeof content === "string") msg[mtype] = text || content;
    else if (content.caption) content.caption = text || content.caption;
    else if (content.text) content.text = text || content.text;
    if (typeof content !== "string") msg[mtype] = { ...content, ...options };
    if (copy.participant) sender = copy.participant = sender || copy.participant;
    else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
    if (copy.key.remoteJid.includes("@s.whatsapp.net")) sender = sender || copy.key.remoteJid;
    else if (copy.key.remoteJid.includes("@broadcast")) sender = sender || copy.key.remoteJid;
    copy.key.remoteJid = jid;
    copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
    return proto.WebMessageInfo.fromObject(copy);
  };

  conn.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
    let m = generateForwardMessageContent(message, !!forwardingScore);
    let mtype = Object.keys(m)[0];
    if (forwardingScore && typeof forwardingScore == "number" && forwardingScore > 1)
    m[mtype].contextInfo.forwardingScore += forwardingScore;
    m = generateWAMessageFromContent(jid, m, { 
       ...options,
      userJid: conn.user.id,
    });
    await conn.relayMessage(jid, m.message, {
      messageId: m.key.id,
      additionalAttributes: { ...options },
    });
    return m;
  };

  conn.loadMessage = conn.loadMessage || (async (messageID) => {
      return Object.entries(conn.chats)
        .filter(([_, { messages }]) => typeof messages === "object")
        .find(([_, { messages }]) =>
          Object.entries(messages).find(
            ([k, v]) => k === messageID || v.key?.id === messageID,
          ),
        )?.[1].messages?.[messageID];
    });

  conn.downloadM = async (m, type, saveToFile) => {
    if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
    const stream = await downloadContentFromMessage(m, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    if (saveToFile) var { filename } = await conn.getFile(buffer, true);
    return saveToFile && fs.existsSync(filename) ? filename : buffer;
  };

  conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || "";
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, "") : mime.split("/")[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    trueFileName = attachExtension ? filename + "." + type.ext : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };
  
  conn.sendSticker = async (jid, path, quoted, options = {}) => {
    let buffer;   
    if (/^https?:\/\//.test(path)) {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    } else if (Buffer.isBuffer(path)) {
        buffer = path;
    } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
        buffer = Buffer.from(path.split(',')[1], 'base64');
    } else {
        buffer = Buffer.alloc(0);
    }

    let { mime } = await FileType.fromBuffer(buffer);
    let convert;

    if (/image\/(jpe?g|png|gif)|octet/.test(mime)) {
        convert = (options && (options.packname || options.author)) ? await Exif.writeExifImg(buffer, options) : await Exif.imageToWebp(buffer);
    } else if (/video/.test(mime)) {
        convert = (options && (options.packname || options.author)) ? await Exif.writeExifVid(buffer, options) : await Exif.videoToWebp(buffer);
    } else if (/webp/.test(mime)) {
        convert = await Exif.writeExifWebp(buffer, options);
    } else {
        convert = Buffer.alloc(0);
    }

    await conn.sendPresenceUpdate('composing', jid);
    return conn.sendMessage(jid, {
        sticker: {
            url: convert
        },
        ...options
    }, { quoted });
  };
  
  conn.parseMention = (text = "") => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + "@s.whatsapp.net");
  };
  
  conn.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || ''
    let messageType = message.mtype ? message.mtype.replace(/Message|WithCaption/gi, '') : mime.split('/')[0]
    const stream = await downloadContentFromMessage(message, messageType)
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

 conn.getName = (jid = "", withoutContact = false) => {
    jid = conn.decodeJid(jid);
    withoutContact = this.withoutContact || withoutContact;
    let v;
    if (jid.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = conn.chats[jid] || {};
        if (!(v.name || v.subject)) v = (await conn.groupMetadata(jid)) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
    v = jid === "0@s.whatsapp.net" ? { jid, vname: "WhatsApp" } : areJidsSameUser(jid, conn.user.id) ? conn.user : conn.chats[jid] || {};
    return ((withoutContact ? "" : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international"));
  };

  conn.processMessageStubType = async (m) => {
    if (!m.messageStubType) return;
    const chat = conn.decodeJid(
      m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || "",
    );
    if (!chat || chat === "status@broadcast") return;
    const emitGroupUpdate = (update) => {
      conn.ev.emit("groups.update", [{ id: chat, ...update }]);
    };
    switch (m.messageStubType) {
      case WAMessageStubType.REVOKE:
      case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
        emitGroupUpdate({ revoke: m.messageStubParameters[0] });
        break;
      case WAMessageStubType.GROUP_CHANGE_ICON:
        emitGroupUpdate({ icon: m.messageStubParameters[0] });
        break;
      default: {
        console.log({
          messageStubType: m.messageStubType,
          messageStubParameters: m.messageStubParameters,
          type: WAMessageStubType[m.messageStubType],
        });
        break;
      }
    }
    const isGroup = chat.endsWith("@g.us");
    if (!isGroup) return;
    let chats = conn.chats[chat];
    if (!chats) chats = conn.chats[chat] = { id: chat };
    chats.isChats = true;
    const metadata = await conn.groupMetadata(chat).catch((_) => null);
    if (!metadata) return;
    chats.subject = metadata.subject;
    chats.metadata = metadata;
  };
  
  conn.insertAllGroup = async () => {
    const groups =
      (await conn.groupFetchAllParticipating().catch((_) => null)) || {};
    for (const group in groups)
      conn.chats[group] = {
        ...(conn.chats[group] || {}),
        id: group,
        subject: groups[group].subject,
        isChats: true,
        metadata: groups[group],
      };
    return conn.chats;
  };

  conn.pushMessage = async (m) => {
    if (!m) return;
    if (!Array.isArray(m)) m = [m];
    for (const message of m) {
      try {
        if (!message) continue;
        if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) 
        conn.processMessageStubType(message).catch(console.error);
        const _mtype = Object.keys(message.message || {});
        const mtype = (!["senderKeyDistributionMessage", "messageContextInfo"].includes(_mtype[0]) && _mtype[0]) || (_mtype.length >= 3 && _mtype[1] !== "messageContextInfo" && _mtype[1]) || _mtype[_mtype.length - 1];
        const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || "");
        if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
          let context = message.message[mtype].contextInfo;
          let participant = conn.decodeJid(context.participant);
          const remoteJid = conn.decodeJid(context.remoteJid || participant);
          let quoted = message.message[mtype].contextInfo.quotedMessage;
          if (remoteJid && remoteJid !== "status@broadcast" && quoted) {
            let qMtype = Object.keys(quoted)[0];
            if (qMtype == "conversation") {
              quoted.extendedTextMessage = { text: quoted[qMtype] };
              delete quoted.conversation;
              qMtype = "extendedTextMessage";
            }
            if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {};
            quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || [];
            const isGroup = remoteJid.endsWith("g.us");
            if (isGroup && !participant) participant = remoteJid;
            const qM = {
              key: {
                remoteJid,
                fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                id: context.stanzaId,
                participant,
              },
              message: JSON.parse(JSON.stringify(quoted)),
              ...(isGroup ? { participant } : {}),
            };
            let qChats = conn.chats[participant];
            if (!qChats) qChats = conn.chats[participant] = {
                id: participant,
                isChats: !isGroup,
            };
            if (!qChats.messages) qChats.messages = {};
            if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM;
            let qChatsMessages;
            if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length));
          }
        }
        if (!chat || chat === "status@broadcast") continue;
        const isGroup = chat.endsWith("@g.us");
        let chats = conn.chats[chat];
        if (!chats) {
          if (isGroup) await conn.insertAllGroup().catch(console.error);
          chats = conn.chats[chat] = {
            id: chat,
            isChats: true,
            ...(conn.chats[chat] || {}),
          };
        }
        let metadata, sender;
        if (isGroup) {
          if (!chats.subject || !chats.metadata) {
          metadata = (await conn.groupMetadata(chat).catch((_) => ({}))) || {};
            if (!chats.subject) chats.subject = metadata.subject || "";
            if (!chats.metadata) chats.metadata = metadata;
          }
          sender = conn.decodeJid(
            (message.key?.fromMe && conn.user.id) ||
              message.participant ||
              message.key?.participant ||
              chat ||
              "",
          );
          if (sender !== chat) {
            let chats = conn.chats[sender];
            if (!chats) chats = conn.chats[sender] = { id: sender };
            if (!chats.name) chats.name = message.pushName || chats.name || "";
          }
        } else if (!chats.name) chats.name = message.pushName || chats.name || "";
        if (["senderKeyDistributionMessage", "messageContextInfo"].includes(mtype)) continue;
        chats.isChats = true;
        if (!chats.messages) chats.messages = {};
        const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
        if (!["protocolMessage"].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
          delete message.message.messageContextInfo;
          delete message.message.senderKeyDistributionMessage;
          chats.messages[message.key.id] = JSON.parse(
            JSON.stringify(message, null, 2),
          );
          let chatsMessages;
          if ((chatsMessages = Object.entries(chats.messages)).length > 40)
            chats.messages = Object.fromEntries(
              chatsMessages.slice(30, chatsMessages.length),
            );
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  conn.setBio = async (status) => {
    return await conn.query({
      tag: "iq",
      attrs: {
        to: "s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [{
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        }],
    });
  };
  
  conn.serializeM = (m) => {
    return exports.smsg(conn, m)
  }
  
  Object.defineProperty(conn, "name", {
    value: "WASocket",
    configurable: true,
  });
  return conn;
};

smsg = (conn, m, hasParent) => {
  if (!m) return m;
  let M = proto.WebMessageInfo;
  m = M.fromObject(m);
  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id.startsWith('DannTeam') && m.id.length === 21 
    m.chat = conn.decodeJid(m.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || "");
    m.isGroup = m.chat.endsWith("@g.us");
    m.sender = conn.decodeJid((m.key.fromMe && conn.user.id) || m.participant || m.key.participant || m.chat || "");
    m.fromMe = m.key.fromMe || areJidsSameUser(m.sender, conn.user.id);
  }
  if (m.message) {
      if (m.message.viewOnceMessage) {
         m.mtype = Object.keys(m.message.viewOnceMessage.message)[0]
         m.msg = m.message.viewOnceMessage.message[m.mtype]
      } else if (m.message.viewOnceMessageV2) {
         m.mtype = Object.keys(m.message.viewOnceMessageV2.message)[0]
         m.msg = m.message.viewOnceMessageV2.message[m.mtype]
      } else {
         m.mtype = Object.keys(m.message)[0] == 'senderKeyDistributionMessage' ? Object.keys(m.message)[2] == 'messageContextInfo' ? Object.keys(m.message)[1] : Object.keys(m.message)[2] : Object.keys(m.message)[0] != 'messageContextInfo' ? Object.keys(m.message)[0] : Object.keys(m.message)[1]
         m.msg = m.message[m.mtype]
      }
      if (m.mtype === 'ephemeralMessage' || m.mtype === 'documentWithCaptionMessage') {
         smsg(conn, m.msg)
         m.mtype = m.msg.mtype
         m.msg = m.msg.msg
   }
   m.text = (m.mtype === 'interactiveResponseMessage') ? JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson).id : (m.mtype === 'conversation') ? m.message.conversation : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.mtype == 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ""
   let quoted = m.quoted = typeof m.msg != 'undefined' ? m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null : null
   m.mentionedJid = typeof m.msg != 'undefined' ? m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : [] : []
    if (m.quoted) {
     let type = Object.keys(m.quoted)[0]
      m.quoted = m.quoted[type]
      if (['productMessage'].includes(type)) {
        type = Object.keys(m.quoted)[0]
        m.quoted = m.quoted[type]
      }
      if (['documentWithCaptionMessage'].includes(type)) {
        type = Object.keys(m.quoted.message)[0]
        m.quoted = m.quoted.message[type]
      }
   // if (['pollCreationMessage']).includes(type) {
     // let pollmsg = await store.loadMessage(m.chat, m.msg.contextInfo.stanzaId)
     // let options = getAggregateVotesInPollMessage(pollmsg, global.sock.user.id)
     // m.quoted.options = options
   // }
     if (typeof m.quoted === 'string') m.quoted = {
        text: m.quoted
      }
      m.quoted.mtype = type
      m.quoted.id = m.msg.contextInfo.stanzaId;
      m.quoted.chat = conn.decodeJid(m.msg.contextInfo.remoteJid || m.chat || m.sender);
      m.quoted.isBaileys = m.quoted.id ? (m.quoted.id.startsWith('DannTeam') && m.quoted.id.length === 21) : false
      m.quoted.sender = conn.decodeJid(m.msg.contextInfo.participant);
      m.quoted.fromMe = m.quoted.sender === conn.user.jid;
      m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.contentText || "";
      m.quoted.name = conn.getName(m.quoted.sender);
      m.quoted.mentionedJid = (m.quoted.contextInfo?.mentionedJid?.length && m.quoted.contextInfo.mentionedJid) || [];
      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          fromMe: m.quoted.fromMe,
          remoteJid: m.quoted.chat,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));
      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return null;
        let q = M.fromObject((await conn.loadMessage(m.quoted.id)) || vM);
        return exports.smsg(conn, q);
      };
      if (m.quoted.url || m.quoted.directPath) m.quoted.download = (saveToFile = false) => conn.downloadM(m.quoted, m.quoted.mtype.replace(/message/i, ""), saveToFile);
      m.quoted.reply = (text, chatId, options) => conn.reply(chatId ? chatId : m.chat, text, vM, options);
      m.quoted.copy = () => exports.smsg(conn, M.fromObject(M.toObject(vM)));
      m.quoted.forward = (jid, forceForward = false) => conn.forwardMessage(jid, vM, forceForward);
      m.quoted.copyNForward = (jid, forceForward = true, options = {}) =>  conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.cMod = (jid, text = "", sender = m.quoted.sender, options = {}) => conn.cMod(jid, vM, text, sender, options);
      m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key });
    }
  }
  m.name = m.pushName || conn.getName(m.sender);
  if (m.msg && m.msg.url) m.download = (saveToFile = false) => conn.downloadM(m.msg, m.mtype.replace(/message/i, ""), saveToFile);
  m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)));
  m.forward = (jid = m.chat, forceForward = false) => conn.copyNForward(jid, m, forceForward, options);

  /*m.reply = async (text, options) => {
     await conn.sendPresenceUpdate('composing', m.chat)
     conn.sendMessage(m.chat, {
          text,
          mentions: conn.parseMention(text),
          ...options
       }, {
          quoted: m,
          ephemeralExpiration: m.expiration
     })
   }*/
  m.reply = async (pesan, options) => {
   const ppUrl = await conn.profilePictureUrl(m.sender, "image").catch((_) => "https://telegra.ph/file/1ecdb5a0aee62ef17d7fc.jpg");
   const a = {
      contextInfo: {
        mentionedJid: conn.parseMention(pesan),
        groupMentions: [],
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: global.saluran,
            newsletterName: "⚠️ Please Follow For Information",
            serverMessageId: -1
        }/*,
        forwardingScore: 256,
        externalAdReply: {
          title: `• Name : [ ${m.name} ]`,
          body: `Runtime : ${global.Func.toTime(process.uptime() * 1000)}`,
          thumbnailUrl: ppUrl,
          sourceUrl: "https://whatsapp.com/channel/0029Vb3e1Ad6GcGCUntMjm2O",
          mediaType: 1,
          renderLargerThumbnail: false,
        },*/
      },
    };
    try {
      if (options && pesan) {
        conn.sendFile(m.chat, options, null, pesan, m, null, a);
      } else {
        if (pesan) {
          conn.reply(m.chat, pesan, m, a);
        } else {
          conn.reply(m.chat, options, m, a);
        }
      }
    } catch (e) {
      conn.reply(m.chat, pesan, m, a);
    }
  };
  m.react = async (emoticon) => {
      let reactionMessage = {
         react: {
            text: emoticon,
            key: m.key
         }
      };
      return await conn.sendMessage(m.chat, reactionMessage);
  };
  m.copyNForward = (jid = m.chat, forceForward = true, options = {}) => conn.copyNForward(jid, m, forceForward, options);
  m.cMod = (jid, text = "", sender = m.sender, options = {}) => conn.cMod(jid, m, text, sender, options);
  m.delete = () => conn.sendMessage(m.chat, { delete: m.key });

  try {
    if (m.msg && m.mtype == "protocolMessage") conn.ev.emit("message.delete", m.msg.key);
  } catch (e) {
    console.error(e);
  }
  return m;
};

exports.smsg = smsg