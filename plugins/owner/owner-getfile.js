/*####################################
                 Killua-Zoldyck
             CREATOR : ZhennSweet
       
✅ WhatsApp: https://wa.me/6285133663663
👥 Groups: https://chat.whatsapp.com/JcCESzVAi0FKRdtCN9F0iQ
#####################################*/

const fs = require('fs');
const path = require('path');

let handler = async (m, { usedPrefix, command, text }) => {
    if (!text) return m.reply(`Where is the text?\n\nExample: ${usedPrefix + command} menu`);
   
    const filename = path.join(__dirname, `./${text}${!/\.js$/i.test(text) ? '.js' : ''}`);
    const listPlugins = fs.readdirSync(__dirname).map(v => v.replace(/\.js$/, ''));

    if (!fs.existsSync(filename)) {
        return m.reply(`'${text}.js' not found!
Available plugins:
${listPlugins.map(v => `- ${v}`).join('\n')}
`.trim());
    }

    try {
        const fileContent = fs.readFileSync(filename, 'utf8');
        m.reply(fileContent);
    } catch (err) {
        m.reply(`Failed to read the file: ${err.message}`);
    }
};

handler.help = ['gf'].map(v => v + ' <file-name>');
handler.tags = ['owner'];
handler.command = ["gf", "getplugin", "getfile"]
handler.rowner = true;

module.exports = handler;