const axios = require("axios");
const { execSync } = require("child_process");
async function checkServerIP() {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/Dwi-Merajah/Database-Public/refs/heads/main/database.json");
    const allowedIPs = data?.ips || [];
    let serverIP;
    try {
      serverIP = execSync("curl -s https://api64.ipify.org").toString().trim();
    } catch (error) {
      console.error("Gagal mendapatkan IP server:", error.message);
      return false;
    }
    console.log("Server IP:", serverIP);
    if (!allowedIPs.includes(serverIP)) {
      console.error(`Akses ditolak! IP (${serverIP}) tidak terdaftar.`);
      return false;
    }
    console.log("Akses diterima! IP terdaftar.");
    return true;
  } catch (error) {
    console.error("Terjadi kesalahan:", error.message);
    return false;
  }
}

module.exports = { checkServerIP }