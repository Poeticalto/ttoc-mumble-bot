var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
var request = require('request');
var readline = require('readline');
var cats = require('cat-ascii-faces');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
var moment = require('moment');

var rgamesLogger = winston.createLogger({
    levels: {
        rgames: 0,
        rqueue: 1
    },
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname,'/logs/rgames/','rgames.log'),
            level: 'rgames'
        }),
        new (winston.transports.DailyRotateFile)({
            filename: path.join(__dirname,'/logs/rqueue/','rqueue.log'),
            prepend: 'true',
            localTime: 'true',
            level: 'rqueue'
        })	
    ]
});
rgamesLogger.exitOnError = false;
rgamesLogger.emitErrs = false;


var mumbleUrl = 'mumble.koalabeast.com';
var botName = 'test_BOT';
var botHome = 'Meep is God';
var botMoveTo = 'Meep is God';
var help = 'I am a bot designed in node.js!';
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:';
var botInfo = "I am a test bot using Poeticalto's ttoc-mumble-bot as a base!";
var greyMessage = "<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)";
var whitelist = ['Poeticalto', 'Poeticaltwo'];
var blacklist = [];
var greylist = [];
var mods = [];
var splitParts;
var splitMessage;
var rPlayerList = [];
var rPlayerServer = [];
var rPlayerElo = [];
var rPlayerGames = [];
var rPlayerWins = [];
var rPlayerLosses = [];
var rPlayerBan = [];
var rankedMaps = ['Transilio','EMERALD','Pilot','Cache','Wormy','Monarch'];
var mumbleSessionNum = [];
var mumbleSessionUsers = [];
var modsMumbleList = [];

if (fs.existsSync(path.join(__dirname,'/bot_data/','mumble_ranked_info.txt'))) {
    rows = fs.readFileSync(path.join(__dirname,'/bot_data/','mumble_ranked_info.txt')).toString().split("\n");
    mumbleUrl = rows[0];
    botName = rows[1];
    botHome = rows[2];
    botMoveTo = rows[3];
    help = rows[4];
    tohelp = rows[5];
    botInfo = rows[6];
    greyMessage = rows[7];
    console.log('Mumble info imported from mumble_info.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','mumble_info.txt'), 'w');
    fs.writeFileSync(path.join(__dirname,'/bot_data/','mumble_info.txt'),mumbleUrl + '\n' + botName + '\n' + botHome + '\n' + botMoveTo + '\n' + help+ '\n'+ tohelp + '\n' + botInfo + '\n' + greyMessage + '\n');
    console.log('mumble_info.txt was created!');
}


if (fs.existsSync(path.join(__dirname,'/bot_data/','ranked_system.txt'))) {
    splitParts = fs.readFileSync(path.join(__dirname,'/bot_data/','ranked_system.txt')).toString().split("\n");
    for (var i = 0; i < splitParts.length; i++) {
        if (splitParts[i].split(" ").length >= 4) {
            rPlayerList.push(splitParts[i].split(" ")[0]);
            rPlayerServer.push(splitParts[i].split(" ")[1]);
            rPlayerElo.push(splitParts[i].split(" ")[2]);
            rPlayerGames.push(splitParts[i].split(" ")[3]);
            rPlayerWins.push(splitParts[i].split(" ")[4]);
            rPlayerLosses.push(splitParts[i].split(" ")[5]);
        }
    }
    console.log('ranked system successfully imported!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','ranked_system.txt'), 'w');
    console.log('ranked_system.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','usergroups.txt'))) {
    splitParts = fs.readFileSync(path.join(__dirname,'/bot_data/','usergroups.txt')).toString().split("\n");
    whitelist = splitParts[0].split(" ");
    mods = splitParts[1].split(" ");
    pseudoMods = splitParts[2].split(" ");
    greylist = splitParts[3].split(" ");
    blacklist = splitParts[4].split(" "); 
    rPlayerBan = splitParts[5].split(" "); 
    ircBridgeBan = splitParts[6].split(" "); // custom groups can be added after this line.
    console.log('user groups imported from usergroups.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','usergroups.txt'), 'w');
    console.log('usergroups.txt was created!');
}

// Defines the certificates to connect to the mumble server through node-mumble
var options = {
    key: fs.readFileSync(path.join(__dirname,'/keys/','rankedkey.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/keys/','rankedcert.pem'))
}

var rQueue = [];
var tpServers = ["centra","diameter","chord","orbit","origin","pi","radius","sphere"];
var rGame01 = [];
var rGame02 = [];
var rGame03 = [];
var rGame04 = [];
var rGame05 = [];
var contentPieces;
var groupSend;
var groupId;
var ggId = [];
var ggLink = [];
var ggAdd;

console.log('Connecting to Mumble Server');
console.log('Connecting');
mumble.connect(mumbleUrl, options, function(error, connection) {
    if (error) { throw new Error(error); }

    connection.authenticate(botName);
    connection.on('initialized', function() {
        console.log('connection ready');
        connection.user.setSelfDeaf(false); // mute/deafens the bot
        connection.user.setComment(help); // sets the help statement as the comment for the bot
		setInterval(callEveryHour, 1000*60*60);
    });

    process.on('uncaughtException', function (exception) {
        console.log(exception);
        process.exit(0);
    });

    connection.on('userRemove', function(data) {
        if (data.actor != null && data.ban == false) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' kicked ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
        } else if (data.actor != null && data.ban == true) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' banned ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
        }
    })

    var users = [];
    var usersf = [];
    var usersl = [];

    connection.on('userState', function(state) {
        if (typeof state != 'undefined'){
            if (mumbleSessionNum.indexOf(state.session) > -1) {
                mumbleSessionUsers[mumbleSessionNum.indexOf(state.session)] = state.name;
            } else {
                mumbleSessionNum.push(state.session);
                mumbleSessionUsers.push(state.name);
            }
            if (users.indexOf(state.name) == -1 && greylist.indexOf(state.name) == -1) {
                users.push(state.name);
                if (mods.indexOf(state.name) > -1 && modsMumbleList.indexOf(state.name) == -1) {
                    modsMumbleList.push(state.name);
                }
            }
            if (users.indexOf(null) > -1) {
                users.splice(users.indexOf(null), 1); //unsure where the null leaks in from, but this removes it	
            }
            if (usersf.indexOf(state.name) == -1) {
                usersf.push(state.name);
                updateuserarray(usersf, usersl);
            }
        }
    });

    function updateuserarray(array1, array2) {
        if (array1.indexOf(null) > -1) {
            array1.splice(array1.indexOf(null), 1);
        }
        for (i = 0; i < array1.length; i++) {
            array2[i] = array1[i].toLowerCase();
        }
    }

    connection.on('user-disconnect', function(state) {
        if (typeof state != 'undefined'){
            if (state.name == botName){
                process.exit(0);
            }
            if (modsMumbleList.indexOf(state.name) > -1) {
                modsMumbleList.splice(modsMumbleList.indexOf(state.name), 1);
            }
            if (greylist.indexOf(state.name) == -1) {
                users.splice(users.indexOf(state.name), 1);
            }
            if (users.indexOf(null) > -1) {
                users.splice(users.indexOf(null), 1);
            }
            if (usersf.indexOf(state.name) > -1) {
                usersf.splice(usersf.indexOf(state.name), 1);
                updateuserarray(usersf, usersl);
            }
            if (rQueue.indexOf(state.name) > -1) {
                rQueue.splice(rQueue.indexOf(state.name),1);
            }
        }
    });

    connection.on('message', function(message, actor, scope) {
        console.log(actor.name);
        message = message.replace(/\n/g, ""); // consolidates message to one line
        reply = "";
        const privateMessage = scope === 'private'; // scope defines how the bot received the message
        const content = message || '';
        const isCommand = content[0] === '!';
        const isRegistered = actor.isRegistered();
        contentPieces = content.slice(1, content.length).split(' ');
        const command = contentPieces[0].slice(0, contentPieces[0].length).split("<br")[0].split("<p")[0].toLowerCase();
        var playerd = contentPieces[1];
        if (contentPieces.length > 2) {
            for (i = 2; i <= contentPieces.length - 1; i++) {
                playerd = playerd + ' ' + contentPieces[i];
            }
        } // arg playerd may have multiple words, so combine everything afters command into one var
        console.log(message);
        if (isCommand && privateMessage) {
            switch (command) {
                case 'backup': // this case is uneeded since function backup runs after each write/splice, but is kept as a redundant measure.
                    if (whitelist.indexOf(actor.name) > -1) {
                        backupRanked();
                        reply = "Everything has been backed up!";
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'cat': // sends a cat to the user.
                    reply = cats();
                    break;
                case 'cats': // sends multiple cats to the user.
                    reply = "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats();
                    break;
                case 'gg': // gg = getgroup, playerd defines the name of the group to retrieve from the bot.
                    if (playerd == undefined) {
                        reply = "Please type a group name to find!";
                    } else if (ggId.indexOf(playerd.toLowerCase()) > -1) {
                        reply = '<br/>Here is the ' + playerd.toLowerCase() + ' group:<br/><br/><a href="' + ggLink[ggId.indexOf(playerd.toLowerCase())] + '"><span style="color:#39a5dd">' + ggLink[ggId.indexOf(playerd.toLowerCase())] + '</span></a>'
                    } else {
                        reply = 'Sorry, a group with that name could not be found. :c';
                    }
                    break;
                case 'ggadd': // ggadd allows actors to add their own group to the bot, allowing others to retrieve it with the !gg command
                    if (blacklist.indexOf(actor.name) > -1){
                        reply = "Sorry, you aren't allowed to use this command! :c";}
                    else {
                        if (contentPieces.length >2){
                            ggAdd = contentPieces[2];
                        }
                        else {
                            ggAdd = false;
                        }
                        if (contentPieces.length > 3){
                            for (i=3; i <= contentPieces.length-1;i++) {		
                                ggAdd = ggAdd + ' '+contentPieces[i];
                            }}
                        playerd = contentPieces[1].toLowerCase();
                        if (ggAdd == false){
                            reply = "Sorry, a name was not specified to save under. Please try again.";
                        }
                        else {
                            if (ggId.indexOf(ggAdd) > -1){
                                ggLink[ggId.indexOf(ggAdd)] = groupSend+groupId;
                            }
                            else {
                                ggId.push(ggAdd);
                                ggLink.push(groupSend+groupId);
                            }}}
                    break;
                case 'help': // sends help info to the actor.
                    reply = help;
                    break;
                case 'info': // displays info about the bot
                    reply = botInfo;
                    break;
                case 'reboot':
                    if (whitelist.indexOf(actor.name) > -1) {
                        process.exit(0);
                    }
                    else {
                        reply = tohelp;
                    }
                    break;
                case 'rgames':
                    reply = "Here are the ranked games currently going on: ";
                    break;
                case 'rjoin':
                    if (rQueue.indexOf(actor.name) == -1 && rQueue.length == 0 && rPlayerList.indexOf(actor.name) > -1){
                        rQueue.push(actor.name);
                        rgamesLogger.rqueue(actor.name+" joined the queue ["+rQueue.length+" total]",{'Timestamp':getDateTime()});
                        reply = "Welcome to the queue! There is 1 player in the queue!";
                    }
                    else if (rQueue.indexOf(actor.name) == -1 && rQueue.length < 7 && rPlayerList.indexOf(actor.name) > -1){
                        rQueue.push(actor.name);
                        rgamesLogger.rqueue(actor.name+" joined the queue ["+rQueue.length+" total]",{'Timestamp':getDateTime()});
                        reply = "Welcome to the queue! There are "+rQueue.length+" players in the queue: "+rQueue;
                    }
                    else if (rQueue.indexOf(actor.name) == -1 && rQueue.length == 7 && rPlayerList.indexOf(actor.name) > -1){
                        rQueue.push(actor.name);
                        rgamesLogger.rqueue(actor.name+" joined the queue ["+rQueue.length+" total]",{'Timestamp':getDateTime()});
                        reply = "Welcome to the queue! The game will start soon!";
                        rSetup();
                    }
                    else if (rQueue.indexOf(actor.name) == -1 && rQueue.length >= 8 && rPlayerList.indexOf(actor.name) > -1){
                        reply = "Sorry, a game is being setup right now. Please try again in a minute!";
                    }
                    else if (rPlayerList.indexOf(actor.name) == -1) {
                        reply = "Sorry, you haven't registered! Use !rregister server to sign up! [Ex. !rregister sphere]";
                    }
                    else {
                        reply = "You're already in the queue with "+rQueue.length+" players: "+rQueue;
                    }
                    break;
                case 'rstats':
                    if (rPlayerList.indexOf(playerd) > -1){
                        reply = playerd+"'s current Elo is "+rPlayerElo[rPlayerList.indexOf(playerd)];
                    }
                    else if (rPlayerList.indexOf(actor.name) > -1){
                        reply = "Your current Elo is "+rPlayerElo[rPlayerList.indexOf(actor.name)];
                    }
                    else{
                        reply = "You're not registered! Sign up using !rregister server";
                    }
                    break;
                case 'rleaders':
                    reply = "Here are the leaders: ";
                    break;
                case 'rleave':
                    if (rQueue.indexOf(actor.name) > -1 && rQueue.length < 8){
                        reply = "You've been removed from the queue!";
                        rQueue.splice(rQueue.indexOf(actor.name),1);
                        rgamesLogger.rqueue(actor.name+" left the queue.",{'Timestamp':getDateTime()});
                    }
                    else if (rQueue.indexOf(actor.name) > -1 && rQueue.length == 8){
                        reply = "Sorry, the game is about to start, you can't leave! :c";
                    }
                    else {
                        reply = "You're not in the queue!";
                    }
                    break;
                case 'rqueue':
                    if (rQueue.length == 0){
                        reply = "There isn't anyone in the queue!";
                    }
                    else if (rQueue.length == 1){
                        reply = "There is 1 player in the queue: "+rQueue;
                    }
                    else {
                        reply = "There are "+rQueue.length+" players in the queue: " + rQueue;
                    }
                    break;
                case 'rregister':
                    if (playerd == undefined){
                        reply = "Sorry, I couldn't process your server choice. Please make sure it is one of the following: "+tpServers;
                    }
                    else{
                        if (actor.isRegistered() == true && rPlayerList.indexOf(actor.name) == -1 && tpServers.indexOf(playerd.toLowerCase()) > -1){
                            rPlayerList.push(actor.name);
                            rPlayerServer.push(playerd);
                            rPlayerElo.push(1000);
                            rPlayerGames.push(0);
                            rPlayerWins.push(0);
                            rPlayerLosses.push(0);
                            reply = "Congrats, you've been registered successfully for "+playerd+"! Use !rjoin to join the queue!";
                            rgamesLogger.rqueue(actor.name+" registered for the first time!",{'Timestamp':getDateTime()});
                            backupRanked();
                        }
                        else if (actor.isRegistered() == true && rPlayerList.indexOf(actor.name) == -1){
                            reply = "Sorry, I couldn't process your server choice. Please make sure it is one of the following: "+tpServers;
                        }
                        else if (actor.isRegistered() == false){
                            reply = "Sorry, you must be authenticated on Mumble in order to register! If you need help authenticating, contact a Mumble mod.";
                        }
                        else if (rPlayerList.indexOf(actor.name) > -1){
                            reply = "You've already registered! Use !rjoin to join the queue!";
                        }
                    }
                    break;
                case 'vr':
                case 'vred':
                    if (rGame01.indexOf(actor.name) > -1){
                        rGame01[13] += 1;
                        if (rGame01[13] > 4){
                            gameProcess(rGame01,true);
                        }
                    }
                    else if (rGame02.indexOf(actor.name) > -1){
                        rGame02[13] += 1;
                        if (rGame02[13] > 4){
                            gameProcess(rGame02,true);
                        }
                    }
                    else if (rGame03.indexOf(actor.name) > -1){
                        rGame03[13] += 1;
                        if (rGame03[13] > 4){
                            gameProcess(rGame03,true);
                        }
                    }
                    else if (rGame04.indexOf(actor.name) > -1){
                        rGame04[13] += 1;
                        if (rGame04[13] > 4){
                            gameProcess(rGame04,true);
                        }
                    }
                    else if (rGame05.indexOf(actor.name) > -1){
                        rGame05[13] += 1;
                        if (rGame05[13] > 4){
                            gameProcess(rGame05,true);
                        }
                    }
                    else {
                        reply = "You're not in a ranked game right now!";
                    }
                    break;
                case 'vb'://14
                case 'vblue':
                    if (rGame01.indexOf(actor.name) > -1){
                        rGame01[14] += 1;
                        if (rGame01[14] > 4){
                            gameProcess(rGame01,false);
                        }
                    }
                    else if (rGame02.indexOf(actor.name) > -1){
                        rGame02[14] += 1;
                        if (rGame02[14] > 4){
                            gameProcess(rGame02,false);
                        }
                    }
                    else if (rGame03.indexOf(actor.name) > -1){
                        rGame03[14] += 1;
                        if (rGame03[14] > 4){
                            gameProcess(rGame03,false);
                        }
                    }
                    else if (rGame04.indexOf(actor.name) > -1){
                        rGame04[14] += 1;
                        if (rGame04[14] > 4){
                            gameProcess(rGame04,false);
                        }
                    }
                    else if (rGame05.indexOf(actor.name) > -1){
                        rGame05[14] += 1;
                        if (rGame05[14] > 4){
                            gameProcess(rGame05,false);
                        }
                    }					
                    break;
                case 'vv':
                case 'vvoid':
                    if (parseInt(playerd) > 0 && parseInt(playerd) < 9){
                        playerd = playerd + 15;
                    }
                    else {
                        playerd = 'none';
                    }
                    if (rGame01.indexOf(actor.name) > -1){
                        rGame01[15] += 1;
                        if (playerd != 'none'){
                            rGame01[parseInt(playerd)] += 1;
                            playerd = rgame01[parseInt(playerd)-16];
                        }
                        if (rGame01[15] > 4){
                            gameProcess(rGame01,playerd);
                        }
                    }
                    else if (rGame02.indexOf(actor.name) > -1){
                        rGame02[15] += 1;
                        if (playerd != 'none'){
                            rGame02[parseInt(playerd)] += 1;
                            playerd = rgame02[parseInt(playerd)-16];
                        }
                        if (rGame02[15] > 4){
                            gameProcess(rGame02,playerd);
                        }
                    }
                    else if (rGame03.indexOf(actor.name) > -1){
                        rGame03[15] += 1;
                        if (playerd != 'none'){
                            rGame03[parseInt(playerd)] += 1;
                            playerd = rgame03[parseInt(playerd)-16];
                        }
                        if (rGame03[15] > 4){
                            gameProcess(rGame03,playerd);
                        }
                    }
                    else if (rGame04.indexOf(actor.name) > -1){
                        rGame04[15] += 1;
                        if (playerd != 'none'){
                            rGame04[parseInt(playerd)] += 1;
                            playerd = rgame04[parseInt(playerd)-16];
                        }
                        if (rGame04[15] > 4){
                            gameProcess(rGame04,playerd);
                        }
                    }
                    else if (rGame05.indexOf(actor.name) > -1){
                        rGame05[15] += 1;
                        if (playerd != 'none'){
                            rGame05[parseInt(playerd)] += 1;
                            playerd = rgame05[parseInt(playerd)-16];
                        }
                        if (rGame05[15] > 4){
                            gameProcess(rGame05,playerd);
                        }
                    }	
                    break;
            }
            var noReply = ['getmail', 'group', 'lock', 'lock+', 'here', 'trade', 'move'];
            if (noReply.indexOf(command) == -1 || reply != '') {
                console.log(reply);
                actor.sendMessage(reply);
            }
        }
    });
    connection.on('error', function(MumbleError) { //incomplete, error event when something goes wrong through mumble, need to add parsing of error
        console.log(MumbleError.name);
        process.exit(0);		
    })
    connection.on('user-move', function(user, fromChannel, toChannel, actor) {
        if (user.name == botName){
            user.moveToChannel(connection.channelByName(botHome));
        }})
		
	function callEveryHour() {
		connection.user.setSelfDeaf(false);
		if (groupmeAuth == true){
			request({
				method: 'POST',
				uri: 'https://api.groupme.com/v3/bots/post',
				body: JSON.stringify({ "bot_id" : groupmeListenId,"text": 'This is an hourly ping' })
			}, function(error, response, body) {
            console.log(body);
			})
		}
	}
})

function backupRanked(){
    console.log('backing up ranked system!');
    splitParts = [];
    for (var i = 0; i < rPlayerList.length; i++) {
        splitParts[i] = rPlayerList[i] + ' ' + rPlayerServer[i] + ' ' + rPlayerElo[i] + ' ' + rPlayerGames[i] + ' ' + rPlayerWins[i] + ' ' + rPlayerLosses[i];
    }
    fs.writeFileSync(path.join(__dirname,'/bot_data/','ranked_system.txt'), splitParts.join('\n'));
    console.log('Ranked system has been backed up!');
}

function createTagProGroup(playerd, ggAdd, actor, toggle, mapname,tempGame) {
    var groupBuild;
    if (playerd == 'maptest' || playerd == 'maptest2' || playerd == 'maptest3') {
        groupBuild = 'http://' + playerd + '.newcompte.fr/groups/create';
        groupSend = 'http://' + playerd + '.newcompte.fr/groups/';
    } else if (playerd == 'test') {
        groupBuild = 'test';
        groupdsend = 'test';
    } else {
        groupBuild = 'http://tagpro-' + playerd + '.koalabeast.com/groups/create';
        groupSend = 'http://tagpro-' + playerd + '.koalabeast.com/groups/';
    }
    request({
        method: 'POST',
        uri: groupBuild,
        multipart: [{
            'follow_redirects': 'false',
            'body': JSON.stringify({ public: "off" })
        }]
    }, function(error, response, body) {
        if (response != null) {
            groupId = body.split("/groups/")[body.split("/groups/").length - 1];
            if (toggle == true) {
                groupId = groupId + "/#tg-" + mapname;
            }
            reply = '<br/>Here is your ' + playerd + ' group:<br/><br/><a href="' + groupSend + groupId + '"><span style="color:#39a5dd">' + groupSend + groupId + '</span></a>';
            if (tempGame.length > 0){
                groupId = groupId + "/#rg-" + mapname;
                reply = '<br/>Your ranked game is ready!<br/>Settings: 8 min game, Golden Cap OT<br/>Map: '+tempGame[12]+'<br/>'+'<a href="'+groupSend+groupId+'"><b><span style="color:#39a5dd">Click here for the group!</span></b></a>'+'<br/><br/>Red (P1-P4): '+tempGame[0]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[0])]+'], '+tempGame[1]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[1])]+'], '+tempGame[2]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[2])]+'], '+tempGame[3]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[3])]+'] ['+tempGame[8]+']<br/>Blue (P5-P8): '+tempGame[4]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[4])]+'], '+tempGame[5]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[5])]+'], '+tempGame[6]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[6])]+'], '+tempGame[7]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[7])]+'] ['+tempGame[9]+']<br/><br/>Vote using !vr, !vb, or !vv #<br/>Use <a href="https://gist.github.com/Poeticalto/00de8353fce79cac9059b22f20242039/raw/a5a6515e75ac210ec9798c00b532742646b4728f/TagPro_Competitive_Group_Maker.user.js"><b><span style="color:#39a5dd">this userscript</span></b></a> to set up groups automatically!<br/><br/>Good luck and have fun!';
            }
            console.log(groupSend + groupId);
        } else {
            if (tempGame.length > 0){
                reply = '<br/>Your ranked game is ready!<br/>Settings: 8 min game, Golden Cap OT<br/>Map: '+tempGame[12]+'<br/>'+'<a href="'+'"><b><span style="color:#39a5dd">ERR creating group, play on '+tempGame[11]+'</span></b></a>'+'<br/><br/>Red (P1-P4): '+tempGame[0]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[0])]+'], '+tempGame[1]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[1])]+'], '+tempGame[2]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[2])]+'], '+tempGame[3]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[3])]+'] ['+tempGame[8]+']<br/>Blue (P5-P8): '+tempGame[4]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[4])]+'], '+tempGame[5]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[5])]+'], '+tempGame[6]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[6])]+'], '+tempGame[7]+'['+rPlayerElo[rPlayerList.indexOf(tempGame[7])]+'] ['+tempGame[9]+']<br/><br/>Vote using !vr, !vb, or !vv #<br/>Use <a href="https://gist.github.com/Poeticalto/00de8353fce79cac9059b22f20242039/raw/a5a6515e75ac210ec9798c00b532742646b4728f/TagPro_Competitive_Group_Maker.user.js"><b><span style="color:#39a5dd">this userscript</span></b></a> to set up groups automatically!<br/><br/>Good luck and have fun!';
            }
            else{
                reply = '<br/> There was an error when creating your group. Check to make sure you put an actual server! c:';
            }
        }
    })
    function random3() {
        console.log(reply);
        if (tempGame.length > 0){
            for (var i = 0;i < 7;i++){ 
                connection.userByName(tempGame[i]).sendMessage(reply);
            }
        }
        else{
            actor.sendMessage(reply);
        }
        if (ggAdd != false && (blacklist.indexOf(actor.name) == -1 || tempGame.length > 0)) { // players on the blacklist will be able to make groups but not add them to the public list of groups
            if (ggId.indexOf(ggAdd) > -1) {
                ggLink[ggId.indexOf(ggAdd)] = groupSend + groupId;
            } else {
                if (tempGame.length > 0) {
                    ggId.push(ggAdd);
                    ggLink.push(groupSend + groupId);
                }
                else {
                    ggId.push(ggAdd.toLowerCase());
                    ggLink.push(groupSend + groupId);
                }
            }
        }
    }
    setTimeout(random3, 1000);
}

function getDateTime() {
    return moment().format('YYYY-MM-DD HH:mm:ss Z');
}

function rSetup(){
    var rTempElo = [];
    for (var i = 0; i < rQueue.length; i++){
        rTempElo[i] = rPlayerElo[rPlayerList.indexOf(rQueue[i])];
    }
    bubbleSortElo(rTempElo,rQueue);
    var tempRed = [rQueue[0]];
    var tempRedElo = rTempElo[0];
    var tempBlue = [];
    var tempBlueElo = 0;
    for (var i = 1;i<rQueue.length;i++){
        if (tempRedElo > tempBlueElo && tempRed.length <= 4){
            tempBlue.push(rQueue[i]);
            tempBlueElo += rTempElo[i];
        }
        else {
            tempRed.push(rQueue[i]);
            tempRedElo += rTempElo[i];
        }
    }
    tempRedElo = tempRedElo/4;
    tempBlueElo = tempBlueElo/4;
    var tempServer = 0;
    for (var i = 0;i < rQueue.length;i++){
        var tempIndex = rPlayerList.indexOf(rQueue[i]);
        rPlayerGames[tempIndex] += 1;
        switch (rPlayerServer[tempIndex]){
            case 'centra':
                tempserver -= 1;
                break;
            case 'origin':
                tempserver += 1;
                break;
            case 'radius':
                tempserver += 1;
                break;
            case 'pi':
                tempserver += 1;
                break;
            case 'orbit':
                tempserver += 2;
                break;
            case 'chord':
                tempserver += 2;
                break;
            case 'diameter':
                tempserver -= 2;
                break;
        }
    }
    if (tempServer <-12){
        tempServer = 'diameter';
    }
    else if (tempServer < -5){
        tempServer = 'centra';
    }
    else if (tempServer < 2){
        tempServer = 'sphere';
    }
    else if (tempServer < 5){
        tempServer = 'origin';
    }
    else if (tempServer <=12){
        tempServer = 'radius';
    }
    else{
        tempServer = 'orbit';
    }
    var randomIndex = Math.floor(Math.random() * rankedMaps.length); 
    var tempMap = rankedMaps[randomIndex];
    var tempId = rPlayerGames.reduce((accumulator, currentValue) => accumulator + currentValue)/8;
    var tempGame = [tempRed[0],tempRed[1],tempRed[2],tempRed[3],tempBlue[0],tempBlue[1],tempBlue[2],tempBlue[3],tempRedElo,tempBlueElo,tempId,tempServer,tempMap,0,0,0,0,0,0,0,0,0,0,0]; 
    if (rGame01.length == 0){
        rGame01 = tempGame;
    }
    else if (rGame02.length == 0){
        rGame02 = tempGame;
    }
    else if (rGame03.length == 0){
        rGame03 = tempGame;
    }
    else if (rGame04.length == 0){
        rGame04 = tempGame;
    }
    else if (rGame05.length == 0){
        rGame05 = tempGame;
    }
    rgamesLogger.rgames(tempGame[10]+' starting with game data: '+tempGame,{'Timestamp':getDateTime()});
    console.log(tempGame);
    rQueue = [];
    createTagProGroup(tempGame[11], tempGame[10], botName, false, tempGame[12],tempGame);
}

function bubbleSortElo(array,arrayb) {
    var done = false;
    while (!done) {
        done = true;
        for (var i = 1; i < array.length; i += 1) {
            if (array[i - 1] < array[i]) {
                done = false;
                var tmp = array[i-1];
                var tmpb = arrayb[i-1];
                array[i-1] = array[i];
                arrayb[i-1] = arrayb[i];
                array[i] = tmp;
                arrayb[i] = tmpb;
            }
        }
    }
    rQueue = arrayb;
    rTempElo = array;
}

function calcElo(player,result,opponent){
    console.log(player+result+opponent);
    var oldElo = rPlayerElo[rPlayerList.indexOf(player)];
    var newElo = 0;
    var changeElo = 0;
    var modElo = rPlayerWins[rPlayerList.indexOf(player)]+rPlayerLosses[rPlayerList.indexOf(player)];
    if (modElo <= 10){
        modElo = 80;
    }
    else if (modElo <= 25){
        modElo = 40;
    }
    else{
        modElo = 20;
    }
    if (result == true){
        newElo = oldElo+modElo*1.5*(1-(1/(Math.pow(10,-(oldElo-opponent)/400)+1)));
        rPlayerElo[rPlayerList.indexOf(player)] = newElo;
        rPlayerWins[rPlayerList.indexOf(player)] += 1;
        connection.userByName(player).sendMessage('<br/>Your ranked game has finished!<br/>Result: WIN<br/>Old Elo: '+oldElo+'<br/>New Elo : '+newElo+' ('+changeElo+')<br/>Thanks for playing! Rejoin the queue with !rjoin ! c:');
    }
    else if (result == false){
        newElo = oldElo+modElo*1.5*(0-(1/(Math.pow(10,-(oldElo-opponent)/400)+1)));; // change to reflect lose equation
        rPlayerElo[rPlayerList.indexOf(player)] = newElo;
        rPlayerLosses[rPlayerList.indexOf(player)] += 1;
        connection.userByName(player).sendMessage('<br/>Your ranked game has finished!<br/>Result: LOSS<br/>Old Elo: '+oldElo+'<br/>New Elo : '+newElo+' ('+changeElo+')<br/>Thanks for playing! Rejoin the queue with !rjoin ! c:');
    }
    else {
        newElo = oldElo;
        connection.userByName(player).sendMessage('<br/>Your ranked game has finished!<br/>Result: VOID due to '+opponent+'<br/>Old Elo: '+oldElo+'<br/>New Elo : '+newElo+' ('+changeElo+')<br/>Thanks for playing! Rejoin the queue with !rjoin ! c:');
    }
}

function gameProcess(process,result){
    rgamesLogger.rgames(process[10]+' finished with result of '+result+' '+process,{'Timestamp':getDateTime()});
    console.log(process);
    if (result == true || result == false){
        if (result == true){
            for (var i = 0; i < 4;i++){
                calcElo(process[i],true,process[9]);
                calcElo(process[i+4],false,process[8]);
            }
        }
        else if (result == false) {
            for (var i = 0; i < 4;i++){
                calcElo(process[i],false,process[9]);
                calcElo(process[i+4],true,process[8]);
            }
        }
    }
    else {
        if (rPlayerList.indexOf(result) > -1){
            rPlayerBan.push(result);
        }
        for (var i = 0; i < 8;i++){
            calcElo(process[i],'voided',result);
        }

    }
    if (rGame01.indexOf(process[0]) > -1){
        rGame01 = [];
    }
    else if (rGame02.indexOf(process[0]) > -1){
        rGame02 = [];
    }
    else if (rGame03.indexOf(process[0]) > -1){
        rGame03 = [];
    }
    else if (rGame04.indexOf(process[0]) > -1){
        rGame04 = [];
    }
    else if (rGame05.indexOf(process[0]) > -1){
        rGame05 = [];
    }
    setTimeout(backupRanked,5000);
}
