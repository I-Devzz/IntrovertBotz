let handler = async (m, { conn, usedPrefix, args }) => {
    const perintah = args[0]?.toLowerCase() || 'tags';
    const tagCount = {};
    const tagHelpMapping = {};
    Object.keys(global.plugins).filter(plugin => !global.plugins[plugin].disabled).forEach(plugin => {
        const tags = Array.isArray(global.plugins[plugin].tags) ? global.plugins[plugin].tags : [];
        const helps = Array.isArray(global.plugins[plugin].help) ? global.plugins[plugin].help : [global.plugins[plugin].help];
        tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
            tagHelpMapping[tag] = [...(tagHelpMapping[tag] || []), ...helps];
        });
    });
    const botInfo = `🤖 *Nama Bot:* ${global.botnet}\n` +
                    `⏳ *Uptime:* ${Func.toTime(process.uptime() * 1000)}\n` +
                    `🏷️ *Prefix:* [ ${usedPrefix} ]\n` +
                    `👥 *Pengguna:* ${Object.keys(global.db.users).length}\n` +
                    `⚙️ *Total Fitur:* ${Object.values(global.plugins).filter(v => v.help && !v.disabled).map(v => v.help).flat().length}`;
    if (perintah === 'tags') {
        const sections = Object.keys(tagCount).sort().map(tag => ({
            rows: [{
                title: tag.toUpperCase(),
                description: `Ada ${tagCount[tag]} perintah di kategori ini`,
                id: `${usedPrefix}menu ${tag}`
            }]
        }));
        const buttons = [{
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: '📚 オートメーション',
                sections
            })
        }];
        conn.sendIAMessage(m.chat, buttons, m, {
            header: ``,
            content: `👋 *Halo @${m.sender.split("@")[0]}!*, Saya *${global.botnet}*, siap membantu Anda!\n\n${botInfo}`,
            footer: 'たまこちゃん',
            media: global.db.setting.cover
        });
    } else if (tagCount[perintah]) {
        const teks = `📚 *MENU ${perintah.toUpperCase()}*\n\n` + tagHelpMapping[perintah].map(cmd => `◦ ${usedPrefix + cmd}`).join('\n');
        await conn.sendMessageModify(m.chat, teks, m, {
            largeThumb: true,
            thumbnailUrl: global.db.setting.cover,
            url: global.db.setting.link
        });
    } else {
        return m.reply('❌ Kategori tidak ditemukan. Gunakan `.menu tags` untuk melihat daftar kategori.');
    }
};

handler.help = ['menu'];
handler.command = ['menu'];
handler.register = true;

module.exports = handler;
