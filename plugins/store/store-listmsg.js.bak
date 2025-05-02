let handler = async (m, { usedPrefix, command }) => {
  let which = command.replace(/list/i, '');
  let msgs = global.db.msgs || {};
  let split = Object.entries(msgs).map(([nama, isi]) => ({ nama, ...isi }));
  
  let fltr;
  if (/audio/i.test(command)) fltr = split
    .filter(v => v.message?.audioMessage && v.message.audioMessage.ptt === false)
    .map(v => '├ ' + v.nama).join('\n');
  if (/vn/i.test(command)) fltr = split
    .filter(v => v.message?.audioMessage && v.message.audioMessage.ptt === true)
    .map(v => '├ ' + v.nama).join('\n');
  if (/video/i.test(command)) fltr = split
    .filter(v => v.message?.videoMessage && !v.message.videoMessage.gifPlayback)
    .map(v => '├ ' + v.nama).join('\n');
  if (/gif/i.test(command)) fltr = split
    .filter(v => v.message?.videoMessage && v.message.videoMessage.gifPlayback)
    .map(v => '├ ' + v.nama).join('\n');
  if (/stic?ker/i.test(command)) fltr = split
    .filter(v => v.message?.stickerMessage)
    .map(v => '├ ' + v.nama).join('\n');
  if (/msg/i.test(command)) fltr = split
    .filter(v => v.message?.extendedTextMessage?.text)
    .map(v => '├ ' + v.nama).join('\n');
  if (/img/i.test(command)) fltr = split
    .filter(v => v.message?.imageMessage)
    .map(v => '├ ' + v.nama).join('\n');
  
  // Default jika tidak ada hasil filter
  fltr = fltr || 'Tidak ada pesan yang ditemukan.';
  
  m.reply(`
┌〔 LIST PESAN 〕
${fltr}
└────
Akses/ambil dengan mengetik:
*${usedPrefix}get${which}* <nama>
atau langsung tanpa perintah
`.trim());
};

handler.help = ['listvn', 'listmsg', 'listvideo', 'listgif', 'listaudio', 'listimg', 'liststicker'];
handler.tags = ['store'];
handler.command = ['listvn', 'listmsg', 'listvideo', 'listgif', 'listaudio', 'listimg', 'liststicker'];
handler.group = true;
module.exports = handler;
