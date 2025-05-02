let { WAMessageStubType } = require('@whiskeysockets/baileys');
let urlRegex = require('url-regex-safe')({ strict: false });
let PhoneNumber = require('awesome-phonenumber');
let chalk = require('chalk');
let fs = require('fs');

module.exports = async function (m, conn = { user: {} }) {
    if (m.isBaileys) return; // Tidak menampilkan pesan dari bot sendiri

    let senderData = global.db.users.find(v => v.jid === m.sender);
    let senderName = senderData && senderData.registered ? senderData.name : await conn.getName(m.sender) || "Anonymous";
    let senderNumber = m.sender || "Anonymous";

    let chatName = await conn.getName(m.chat) || "Anonymous";
    let chatInfo = m.chat.endsWith('@g.us') ? `Group   : ${chatName}` : `Chat    : ${chatName}`;

    let fileSize = (m.msg && m.msg.fileLength) ? m.msg.fileLength.low || m.msg.fileLength : 0;
    let formattedSize = fileSize > 0 ? Func.formatSize(fileSize) : "-";

    let mediaType = m.mimetype ? m.mimetype.split('/')[0] : 'text';
    let messageType = m.mtype ? m.mtype.replace(/message$/i, '').toUpperCase() : 'TEXT';

    // Mengubah mention @628xxxxx menjadi nama jika tersedia, jika tidak "Anonymous"
    let mentionedUsers = m.text ? [...new Set(m.text.match(/@(\d{5,15})/g) || [])] : [];
    let messageText = m.text || "No message";

    for (let mention of mentionedUsers) {
        let mentionedNumber = mention.replace('@', '') + "@s.whatsapp.net";
        let mentionedData = global.db.users.find(v => v.jid === mentionedNumber);
        let mentionedName = mentionedData && mentionedData.name ? mentionedData.name : await conn.getName(mentionedNumber) || "Anonymous";
        messageText = messageText.replace(mention, `@${mentionedName}`);
    }

    console.log(chalk.cyan(`[=================]`));
    console.log(chalk.green(`[+] NAME    : ${senderName}`));
    console.log(chalk.yellow(`[+] SENDER  : ${senderNumber}`));
    console.log(chalk.blue(`[+] ${chatInfo}`));
    console.log(chalk.magenta(`[+] ID      : ${m.id || "No ID"}`));
    console.log(chalk.magenta(`[+] TYPE    : ${messageType}`));
    if (fileSize > 0) console.log(chalk.red(`[+] SIZE    : ${formattedSize}`));
    console.log(chalk.white(`[+] MESSAGE : ${messageText}`));
    console.log(chalk.cyan(`[=================]\n`));
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`♻️ Update '${__filename}'`));
    delete require.cache[file];
});
