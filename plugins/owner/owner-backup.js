const fs = require("fs");
const archiver = require("archiver");
const path = require("path");

let handler = async (m, { conn }) => {
  m.reply("please wait a minute")
  let backupName = `[ ZIP ] - Zoldyck.zip`;
  let output = fs.createWriteStream(backupName);
  let archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", async function () {
    let caption = `*[ BACKUP SCRIPT ]*
> • *Nama file:* ${backupName}\n> • *Ukuran file:* ${Func.formatSize(archive.pointer())}`;
    await conn.sendMessage(m.sender,
        {
        document: {
          url: backupName,
        },
        fileName: backupName,
        caption: caption,
        mimetype: "application/zip",
      },
      { quoted: m },
    );

    setTimeout(() => {
      fs.rmSync(backupName);
    }, 5000);
  });

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      console.warn(err);
    } else {
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });

  archive.pipe(output);
  archive.glob("**/*", {
    cwd: path.resolve(__dirname, "../"),
    ignore: [
      "node_modules/**",
      "temp/**",
      "**/flyaudio/**",
      "**.pm2/**",
      ".npm/**",
      "sessions/**",
      "session-backup**",
      backupName,
    ],
  });
  archive.finalize();
};

handler.help = ["backup"]
handler.tags = ["owner"];
handler.command = ["backup"];
handler.rowner = true;

module.exports = handler;
