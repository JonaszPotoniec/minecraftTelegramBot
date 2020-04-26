const Rcon = require('rcon');
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config.json');
const sqlite = require('sqlite3');

let lastPlayerList = [];

rconClient = new Rcon(
    config.rcon.host,
    config.rcon.port,
    config.rcon.password,
    config.rcon.options
                 );
const bot = new TelegramBot(config.botToken, {polling: true});
let db = new sqlite.Database('./sqlite.db');

rconClient.on('auth', function() {
    console.log("Rcon connected");

}).on('response', function(str) {
    let strArr = str.split("");
    strArr.splice(0, 40);
    strArr = strArr.join("").split(" ");
    
    let changed = [];
    
    strArr.forEach((e) => {
        if(e != undefined && e != " ")
            if(lastPlayerList.indexOf(e) === -1)
                changed.push(e);
    })
    
    changed.forEach((e) =>  {
        if(changed.length > 0){
            db.all('SELECT msgid FROM users', [], (err, rows) => {   
                if (err) {
                    console.error(err);
                } 
                rows.forEach((row) => {
                    bot.sendMessage(row.msgid, e + " joined the server", {"disable_notification": true});
                });
            });
        };
        console.log(e + " joined the server");
    });
    
    lastPlayerList = strArr;
}).on('end', function() {
    console.log("Rcon disconnected");
    process.exit();

});


bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome\nYou can start monitoring player list by sending me /monitor or you can get player list by sending /list");
})

bot.onText(/\/monitor/, (msg) => {
    db.run('insert or ignore into users values (' + msg.chat.id + ')');
    bot.sendMessage(msg.chat.id, "If you want to unsubscribe use command /unsubscribe");
})

bot.onText(/\/unsubscribe/, (msg) => {
    db.run('DELETE FROM users WHERE msgid = "' + msg.chat.id + '"');
})

bot.onText(/\/list/, (msg) => {
    bot.sendMessage(msg.chat.id, "Players: \n"+lastPlayerList.join("\n"));
})



rconClient.connect();
setInterval(()=>rconClient.send("/list"), config.frequency);
