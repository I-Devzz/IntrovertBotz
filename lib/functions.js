const { Function: Func } = new(require('@neoxr/wb'))
const moment = require("moment-timezone");

Func.getRandom = (number) => {
  return Math.floor(Math.random() * number);
}
Func.tanggal = (numer) => {
    let myMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
      myDays = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum’at", "Sabtu"]
    var tgl = new Date(numer);
    var day = tgl.getDate();
    var bulan = tgl.getMonth();
    var thisDay = tgl.getDay(),
      thisDay = myDays[thisDay];
    var yy = tgl.getYear();
    var year = yy < 1000 ? yy + 1900 : yy;
    const time = moment.tz("Asia/Makassar").format("DD/MM HH:mm:ss");
    let d = new Date();
    let locale = "id";
    let gmt = new Date(0).getTime() - new Date("1 January 1970").getTime();
    let weton = ["Pahing", "Pon", "Wage", "Kliwon", "Legi"][
      Math.floor((d * 1 + gmt) / 84600000) % 5
    ];
    return `${thisDay}, ${day} - ${myMonths[bulan]} - ${year}`;
};
Func.m2k = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

const fs = require('fs')
const chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright("Update 'config.js'"))
  delete require.cache[file]
  require(file)
})