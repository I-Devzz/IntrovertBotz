(async () => {
    require("./config");
    require('./lib/functions'), require('./lib/scraper')
    require('events').EventEmitter.defaultMaxListeners = 500
    const {
        default: makeWASocket,
        useMultiFileAuthState,
        makeInMemoryStore,
        makeCacheableSignalKeyStore,
        makeWALegacySocket,
        DisconnectReason,
        Browsers,
        fetchLatestBaileysVersion,
        PHONENUMBER_MCC,
        getAggregateVotesInPollMessage,
    } = require("@whiskeysockets/baileys");
    const path = require("path");
    const NodeCache = require("node-cache");
    const pino = require("pino");
    const { Boom } = require("@hapi/boom");
    const fs = require("fs");
    const chokidar = require("chokidar");
    const readline = require("readline");
    const yargs = require("yargs/yargs");
    const cp = require("child_process");
    const { promisify } = require("util");
    const exec = promisify(cp.exec).bind(cp);
    const _ = require("lodash");
    const syntaxError = require("syntax-error");
    const os = require("os");
    const { randomBytes } = require("crypto");
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Makassar").format("HH:mm:ss");
    const chalk = require("chalk");
    const readdirAsync = promisify(fs.readdir);
    const statAsync = promisify(fs.stat);
    const PhoneNumber = require("awesome-phonenumber");
    let simple = require("./lib/simple");
    const Session = require('./lib/backup');
    const session = new Session();
  
    global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in APIs ? APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: APIKeys[name in APIs ? APIs[name] : name] } : {}) })) : '')

    timestamp = {
        start: new Date(),
    };

    const killua = new(require('./lib/database/localdb'))(global.database)
    global.db = {
        users: [],
        chats: [],
        groups: [],
        guild: [],
        redeem: {},
        menfess: {},
        statistic: {},
        sticker: {},
        msgs: {},
        setting: {},
        ...(await killua.fetch() || {})
    }

    await killua.save(global.db)
    setInterval(async () => {
        if (global.db) await killua.save(global.db)
    }, 30 * 1000)

    const store = makeInMemoryStore({
        logger: pino().child({
            level: 'silent',
            stream: 'store'
        })
    })
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

    global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse(), );
    global.prefix = new RegExp("^[" + (opts["prefix"] || "/!#$%+Â£Â¢â‚¬Â¥^Â°=Â¶âˆ†Ã—Ã·Ï€âˆšâœ“Â©Â®:;?&.\\-").replace(/[|\\{}()[\]^$+*?.\-\^]/g, "\\$&") + "]");

    const messageRetryCache = new NodeCache();
    const {
        state,
        saveState,
        saveCreds
    } = await useMultiFileAuthState("sessions");
    const {
        version
    } = await fetchLatestBaileysVersion();
    store.readFromFile(path.join(process.cwd(), "sessions", "store.json"));

    const connectionOptions = {
        printQRInTerminal: !process.argv.includes("--code"),
        syncFullHistory: true,
        markOnlineOnConnect: true,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        patchMessageBeforeSending: (message) => {
            const context = message.buttonsMessage || message.templateMessage || message.listMessage;
            if (context) {
                message = {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {},
                            },
                            ...message,
                        },
                    },
                };
            }
            return message;
        },
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            if (store) {
                const message = await store.loadMessage(key.remoteJid, key.id);
                return message?.message || undefined;
            }
            return {
                conversation: "I-Botzz"
            };
        },
        msgRetryCounterCache: messageRetryCache,
        defaultQueryTimeoutMs: undefined,
        version,
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({
            level: 'fatal'
        }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino().child({
                level: 'silent',
                stream: 'store'
            })),
        },
    }

    setInterval(
        async () => {
                await exec("rm -rf ./temp/*");
            },
            60 * 60 * 1000,
    );

    global.conn = simple.makeWASocket(connectionOptions);
    conn.isInit = false;
    const connectionUpdate = async (update) => {
        const {
            connection,
            lastDisconnect,
            isNewLogin
        } = update;
        const statusCode = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (isNewLogin) conn.isInit = true;
        const disconnectReasons = {
            [DisconnectReason.badSession]: {
                msg: 'Sesi buruk, hapus folder sessions dan scan kembali',
                action: 'error'
            },
            [DisconnectReason.connectionClosed]: {
                msg: 'Sambungan ditutup, menyambung kembali...',
                action: 'reload'
            },
            [DisconnectReason.connectionLost]: {
                msg: 'Kehilangan koneksi server, menghubungkan kembali...',
                action: 'reload'
            },
            [DisconnectReason.connectionReplaced]: {
                msg: 'Koneksi diganti, sesi lain telah dibuka',
                action: 'error'
            },
            [DisconnectReason.loggedOut]: {
                msg: 'Koneksi ditutup, hapus folder sessions dan scan kembali',
                action: 'error'
            },
            [DisconnectReason.restartRequired]: {
                msg: 'Waktu koneksi habis, restart server jika perlu',
                action: 'reload'
            },
            [DisconnectReason.timedOut]: {
                msg: 'Koneksi terputus, menghubungkan ulang...',
                action: 'reload'
            }
        };

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const response = disconnectReasons[reason] || {
                msg: `Koneksi Terputus: ${reason || ''}`,
                action: 'reload'
            };

            conn.logger[response.action === 'error' ? 'error' : 'warn'](`[⚠] ${response.msg}`);
            if (response.action === 'reload') reloadHandler(true);
        }

        if (connection === "open") {
          session.backup(conn, './sessions');
          const exists = session.isBackupExist(conn);
          console.log(chalk.green.bold('[ 接続 ]'));
        }
    };

    async function validatePhoneNumber(input) {
        let phoneNumber = input.replace(/[^0-9]/g, "");
        let pn = phoneNumber.startsWith("+") ? new PhoneNumber(phoneNumber) : new PhoneNumber(`+${phoneNumber}`);
        if (!pn.isValid() || !pn.isMobile()) {
            console.log(chalk.redBright("❌ Invalid phone number. Please enter a valid WhatsApp number (e.g., 62xxx)."));
            return null;
        }
        return pn.getNumber("e164").replace("+", "");
    }

    if (!conn.authState.creds.registered) {
        console.log(chalk.cyan("Please enter your WhatsApp number:"));
        let phoneNumber;
        while (!phoneNumber) {
            let input = await question(`${chalk.cyan("- Number")}: `);
            phoneNumber = await validatePhoneNumber(input);
        }
        let code = await conn.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(chalk.green(`💻 Your Pairing Code: ${chalk.bold(code)}`));
        rl.close();
    }

    store.bind(conn.ev)
    process.on("uncaughtException", console.error);

    let isInit = true,
     handler = require("./handler"); 
    const reloadHandler = (restartConn) => {
        const newHandler = require("./handler");
        if (Object.keys(newHandler || {}).length) handler = newHandler;

        if (restartConn) {
          try {
            conn.ws.close();
          } catch {}
             conn = {
              ...conn,
              ...simple.makeWASocket(connectionOptions),
          };
        }

        const eventHandlers = {
            welcome: 'Welcome to @subject, @user\n',
            bye: 'Goodbye @user 👋',
            spromote: '@user *Promote* to Admin ',
            sdemote: '@user *Demote* from Admin',
            sDesc: 'Description Has Been Changed To \n@desc',
            sSubject: 'Group Name Has Been Changed To \n@subject',
            sIcon: 'Group Photo Has Been Changed!',
            sRevoke: 'Group Link Has Been Changed To \n@revoke',
            sAnnounceOn: 'The group has been closed!\now only admins can send messages.',
            sAnnounceOff: 'The group is open!\nNow all participants can send messages.',
            sRestrictOn: 'Edit Group Info changed to admin only!',
            sRestrictOff: 'Edit Group Info changed to all participants!'
        };

        const connEvents = [
            ["messages.upsert", "handler"],
            ["group-participants.update", "onParticipantsUpdate"],
            ["connection.update", "connectionUpdate"],
            ["creds.update", "credsUpdate"]
        ];

        if (!isInit) {
            for (const [event, handler] of connEvents) {
                conn.ev.off(event, conn[handler]);
            }
        }

        Object.assign(conn, eventHandlers, {
            handler: handler.handler.bind(conn),
            onParticipantsUpdate: handler.participantsUpdate.bind(conn),
            connectionUpdate: connectionUpdate.bind(conn),
            credsUpdate: saveCreds.bind(conn)
        });

        for (const [event, handler] of connEvents) {
            conn.ev.on(event, conn[handler]);
        }

        isInit = false;
        return true;
    };

    global.plugins = {};

    let getAllFiles = async (dirPath) => {
        let files = await readdirAsync(dirPath);
        let allFiles = await Promise.all(
            files.map(async (file) => {
                let filePath = path.resolve(dirPath, file);
                if ((await statAsync(filePath)).isDirectory()) {
                    return getAllFiles(filePath);
                } else {
                    return filePath;
                }
            })
        );
        return allFiles.reduce((acc, files) => acc.concat(files), []);
    };

    try {
        let pluginFiles = await getAllFiles("./plugins");
        let loadedPlugins = {};
        for (let file of pluginFiles.map((file) => file.replace(process.cwd(), ""))) {
            try {
                loadedPlugins[file] = require(path.join(process.cwd(), file));
            } catch (error) {
                console.log(chalk.red.bold(error));
                delete loadedPlugins[file];
            }
        }
        const watcher = chokidar.watch(path.resolve("./plugins"), {
            persistent: true,
            ignoreInitial: true,
        });
        watcher
            .on("add", async (filePath) => {
                console.log(chalk.yellow.bold("[ New ] Detected New Plugins : " + filePath.replace(process.cwd(), "")));
                loadedPlugins[filePath.replace(process.cwd(), "")] = require(filePath);
            })
            .on("change", async (filePath) => {
                if (require.cache[filePath] && require.cache[filePath].id === filePath) {
                    loadedPlugins[filePath.replace(process.cwd(), "")] = require.cache[filePath].exports;
                    console.log(chalk.yellow.bold("[ Change ] Changes code in Plugins : " + filePath.replace(process.cwd(), "")));
                    delete require.cache[filePath];
                }
                let syntaxErrorResult = syntaxError(fs.readFileSync(filePath), filePath.replace(process.cwd(), ""));
                if (syntaxErrorResult) {
                    conn.logger.error("syntax error while loading '" + filePath + "'\n" + syntaxErrorResult);
                }
                loadedPlugins[filePath.replace(process.cwd(), "")] = require(filePath);
            })
            .on("unlink", (filePath) => {
                console.log(chalk.yellow.bold("[ Delete ] Suucess Delete : " + filePath.replace(process.cwd(), "")));
                delete loadedPlugins[filePath.replace(process.cwd(), "")];
            });
        loadedPlugins = Object.fromEntries(Object.entries(loadedPlugins).sort(([key1], [key2]) => key1.localeCompare(key2)));
        global.plugins = loadedPlugins;
        console.log(chalk.blue.bold("[ Success ] Success Load " + Object.keys(loadedPlugins).length + " plugins"));
    } catch (error) {
        console.error(error);
    }

    const resetLimit = async () => {
        const setting = global.db.setting;
        try {
            const Makassar = new Date(new Date().toLocaleString("en-US", {
                timeZone: "Asia/Makassar"
            }));
            setting.lastReset = new Date().getTime();
            global.db.users.filter(v => v.limit < 100 && !v.premium).forEach(v => v.limit = 100);
            Object.values(global.db.statistic).forEach(v => v.today = 0);
            Object.values(global.db.users).forEach(v => v.daily = false);
            await conn.reply("status@broadcast", `*[ Auto Information ]*\nLimit pengguna gratis telah di reset.`);
            console.log('Limit telah direset pada jam 12 malam');
        } catch (e) {
            console.log('Terjadi kesalahan saat mereset limit:', e);
        }
    };

    const msToMidnight = () => {
        const Makassar = new Date(new Date().toLocaleString("en-US", {
            timeZone: "Asia/Makassar"
        }));
        const midnight = new Date(Makassar);
        midnight.setHours(24, 0, 0, 0);
        return midnight.getTime() - Makassar.getTime()
    };

    const scheduleReset = () => {
        const waitTime = msToMidnight();
        setTimeout(() => {
            resetLimit();
            scheduleReset();
        }, waitTime);
    };

    scheduleReset();
    reloadHandler();
})();