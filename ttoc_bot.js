var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
var request = require('request');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var cats = require('cat-ascii-faces');
var WebClient = require('@slack/client').WebClient;
var GroupMe = require('groupme');
var API = GroupMe.Stateless;
const path = require('path');
var winston = require('winston');
require('winston-daily-rotate-file');
var irc = require('irc');
var script = google.script('v1');
var sheets = google.sheets('v4');
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/forms'];

var moment = require('moment');

// Logger setup, all logs are stored in the logs folder.
var mumbleLogger = winston.createLogger({
	levels: {
		error: 0,
		chat: 1,
		mlog: 2
	},
	transports: [
		new (winston.transports.DailyRotateFile)({
			filename: path.join(__dirname,'/logs/error/','error.log'),
			prepend: true,
			localTime: true,
			level: 'error'
		}),
		new (winston.transports.DailyRotateFile)({
			filename: path.join(__dirname,'/logs/mumblechat/','chat.log'),
			prepend: true,
			localTime: true,
			level: 'chat'
		}),
		new (winston.transports.DailyRotateFile)({
			filename: path.join(__dirname,'/logs/mumblelog/','mlog.log'),
			prepend: true,
			localTime: true,
			createTree: false,
			level: 'mlog'
		})
	]
});



var ircLogger = winston.createLogger({
	levels: {
		chat : 1,
		irclog: 2
	},
	transports: [
		new (winston.transports.DailyRotateFile)({
			filename: path.join(__dirname,'/logs/irc/','ircchat.log'),
			localTime: true,
			createTree: false,
			level: 'chat'
		}),
    new (winston.transports.DailyRotateFile)({
			filename: path.join(__dirname,'/logs/irc/','irclog.log'),
			createTree: false,
			localTime: true,
			level: 'irclog'
		})	
	]
});

mumbleLogger.exitOnError = false;
mumbleLogger.emitErrs = false;

// Location for the token used to verify Google oAuth. This was taken from the nodejs quickstart, so if you have the token saved elsewhere, change the DIR/PATH.
var TOKEN_PATH = path.join(__dirname,'/keys/','gappAuth.json');

// The following are defaults for the various functions of the bot
var mumbleUrl = 'mumble.koalabeast.com';
var botName = 'test_BOT';
var botHome = 'Meep is God';
var botMoveTo = 'Meep is God';
var help = 'I am a bot designed in node.js!';
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:';
var botInfo = "I am a test bot using Poeticalto's ttoc-mumble-bot as a base!";
var greyMessage = "<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)";
var activeScriptId = 'none';
var activeSpreadsheetId = 'none';
var scriptId = [];
var spreadsheetId = [];
var tournamentLabel = [];
var activeTournament = 'none';
var mailUser = [];
var mailSender = [];
var mailMessage = [];
var mailTimestamp = [];
var rows;
var tournamentName;
var tournamentServer;
var seasonNum;
var ssMapName;
var ssMapLink;
var sgnLink;
var ssLink;
var whitelist = ['Poeticalto', 'Poeticaltwo'];
var blacklist = [];
var greylist = [];
var mods = [];
var tournamentRunners = [];
var pseudoMods = [];
var	rPlayerBan = []; 
var	ircBridgeBan = [];
var welcomeUser = [];
var welcomeMessage = [];
var slackAuth = false;
var slackChannel = undefined;
var slackToken = undefined;
var groupmeAuth = false;
var groupmeAccessToken = undefined;
var groupmeGroupId = undefined;
var groupmeUsername = undefined;
var GMBOT = undefined;
var groupmeUserId = undefined;
var groupmeBotId = null;
var groupmeListenId = undefined;
var gAuth = false;
var gappkey;
var ircAuth = false;
var splitParts;
var splitMessage;

// for each file, replaces the defaults if it exists.
// consult the readme for help on how to setup each .txt file.


if (fs.existsSync(path.join(__dirname,'/bot_data/','gscript_info.txt'))) {
    rows = fs.readFileSync(path.join(__dirname,'/bot_data/','gscript_info.txt')).toString().split("\n");
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].split(" ").length >= 3) {
            tournamentLabel.push(rows[i].split(" ")[0]);
            scriptId.push(rows[i].split(" ")[1]);
            spreadsheetId.push(rows[i].split(" ")[2]);
        }
    }	
	console.log('gscript info imported from gscript_info.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','gscript_info.txt'), 'w');
	fs.writeFileSync(path.join(__dirname,'/bot_data/','gscript_info.txt'),activeTournament + ' ' + activeScriptId + ' ' + activeSpreadsheetId + '\n');
    console.log('gscript_info.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','irc_info.txt'))) {
    ircChannel = fs.readFileSync(path.join(__dirname,'/bot_data/','irc_info.txt')).toString().split("\n");
	ircServer = ircChannel[0];
	ircName = ircChannel[1];
	ircPassword = ircChannel[3];
	ircChannel = ircChannel[2];
    ircAuth = false;
    console.log('IRC server info imported from irc_info.txt!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','mail_system.txt'))) {
    splitParts = fs.readFileSync(path.join(__dirname,'/bot_data/','mail_system.txt')).toString().split("\n");
    for (var i = 0; i < splitParts.length; i++) {
        if (splitParts[i].split(" ").length >= 4) {
            mailTimestamp.push(splitParts[i].split(" ")[0]);
            mailSender.push(splitParts[i].split(" ")[1]);
            mailUser.push(splitParts[i].split(" ")[2]);
            splitMessage = splitParts[i].split(" ")[3];
            for (var j = 4; j < splitParts[i].split(" ").length; j++) {
                splitMessage = splitMessage + ' ' + splitParts[i].split(" ")[j];
            }
            mailMessage.push(splitMessage);
        }
    }
	console.log('mail system successfully imported!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','mail_system.txt'), 'w');
    console.log('mail_system.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','mumble_info.txt'))) {
    rows = fs.readFileSync(path.join(__dirname,'/bot_data/','mumble_info.txt')).toString().split("\n");
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

if (fs.existsSync(path.join(__dirname,'/bot_data/','welcome_system.txt'))) {
    splitParts = fs.readFileSync(path.join(__dirname,'/bot_data/','welcome_system.txt')).toString().split("\n");
    for (var i = 0; i < splitParts.length; i++) {
        if (splitParts[i].split(" ").length >= 2) {
            welcomeUser.push(splitParts[i].split(" ")[0]);
            splitMessage = splitParts[i].split(" ")[1];
            for (var j = 2; j < splitParts[i].split(" ").length; j++) {
                splitMessage = splitMessage + ' ' + splitParts[i].split(" ")[j];
            }
            welcomeMessage.push(splitMessage);
        }
    }
	console.log('welcome system successfully imported!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','welcome_system.txt'), 'w');
    console.log('welcome_system.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','tournament_info.txt'))) {
    rows = fs.readFileSync(path.join(__dirname,'/bot_data/','tournament_info.txt')).toString().split("\n");
	tournamentName = rows[0];
	tournamentServer = rows[2];
    seasonNum = rows[1]; // seasonNum refers to the season # of the tourney
    ssMapName = rows[3]; // ssMapName is the map name for the tourney
    ssMapLink = rows[4]; // ssMapLink is the link for the map
    sgnLink = rows[5]; // sgnLink is the signup link for the tourney
    ssLink = rows[6]; // ssLink is the spreadsheet link for the tourney
    console.log('Spreadsheet info imported from tournament_info.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','tournament_info.txt'), 'w');
    console.log('tournament_info.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/bot_data/','usergroups.txt'))) {
    splitParts = fs.readFileSync(path.join(__dirname,'/bot_data/','usergroups.txt')).toString().split("\n");
    whitelist = splitParts[0].split(" ");
    mods = splitParts[1].split(" ");
    pseudoMods = splitParts[2].split(" ");
    greylist = splitParts[3].split(" ");
    blacklist = splitParts[4].split(" "); 
	rPlayerBan = splitParts[5].split(" "); 
	ircBridgeBan = splitParts[6].split(" "); 
	tournamentRunners = splitParts[7].split(" ");// custom groups can be added after this line.
    console.log('user groups imported from usergroups.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','usergroups.txt'), 'w');
    console.log('usergroups.txt was created!');
}

if (fs.existsSync(path.join(__dirname,'/keys/','slack_keys.txt'))) {
    slackToken = fs.readFileSync(path.join(__dirname,'/keys/','slack_keys.txt')).toString().split("\n");
    slackChannel = slackToken[1]; // slackChannel is the channel to send notifs to on slack
    slackToken = slackToken[0]; // slackToken is the API key to talk to slack
    slackAuth = true;
    console.log('Slack keys imported from slack_keys.txt!');
}

if (fs.existsSync(path.join(__dirname,'/keys/','groupme_keys.txt'))) {
    groupmeAccessToken = fs.readFileSync(path.join(__dirname,'/keys/','groupme_keys.txt')).toString().split("\n");
    groupmeGroupId = groupmeAccessToken[4]; // groupmeGroupId is the group id to send groupme messages to
    groupmeUsername = groupmeAccessToken[3]; // groupmeUsername is your groupme name in the group, used to filter out messages
    GMBOT = groupmeAccessToken[2]; // GMBOT is the name of your groupme bot
    groupmeUserId = groupmeAccessToken[1]; // groupmeUserId is your user id [not the bot id]
	groupmeListenId = groupmeAccessToken[5];
    groupmeAccessToken = groupmeAccessToken[0]; // groupmeAccessToken is your groupme access token
    groupmeAuth = true;
    console.log('GroupMe keys imported from groupme_keys.txt!');
}

// Defines the certificates to connect to the mumble server through node-mumble
var options = {
    key: fs.readFileSync(path.join(__dirname,'/keys/','botkey.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/keys/','botcerts.pem'))
}

// The following section is the GApps authorization stuff needed to create OAuth keys
// It is taken from the quickstart for node.js, so check that out if you need help with it.
// https://developers.google.com/apps-script/guides/rest/quickstart/nodejs
// Load client secrets from a local file.
if (fs.existsSync(path.join(__dirname,'/keys/','client_secret.json'))) {
    fs.readFile(path.join(__dirname,'/keys/','client_secret.json'), function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // sets the client secret to a variable to be used when running Gapp stuff.
        gappkey = content;
        gAuth = true;
		if (activeScriptId == "none" || activeSpreadsheetId == "none"){
			console.log('An illegal scriptID or spreadsheetID has been detected, gAuth has been switched off to prevent issues!');
			gAuth = false;
		}
    });
}

function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function(err, token) {
        if (err) {
            getNewToken(oauth2Client, callback);
        } else {
            oauth2Client.credentials = JSON.parse(token);
            callback(oauth2Client);
        }
    });
}

function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

function storeToken(token) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
}

// END OF GOOGLE AUTH SECTION

// These are the individual functions used to run the Google Scripts needed for tourney
function gscriptrun(auth) { // This function runs code from Google Scripts
    // Make the API request. The request object is included here as 'resource'.
    script.scripts.run({
        auth: auth,
        resource: {
            function: gScriptName
        },
        scriptId: activeScriptId
    }, function(err, resp) {
        if (err) {
            console.log('The API returned an error: ' + err); // The API encountered a problem before the script started executing.
            return;
        }
        if (resp.error) {
            var error = resp.error.details[0];
            console.log('Script error message: ' + error.errorMessage);
            console.log('Script error stacktrace:'); // The API executed, but the script returned an error.
            if (error.scriptStackTraceElements) {
                // There may not be a stacktrace if the script didn't start executing.
                for (var i = 0; i < error.scriptStackTraceElements.length; i++) {
                    var trace = error.scriptStackTraceElements[i];
                    console.log('\t%s: %s', trace.function, trace.lineNumber);
                }
            }
        } else {
            console.log('Success!');
        }
    });
}

function ssread(auth) { // this function reads a range from the spreadsheet
    testarr = [];
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: activeSpreadsheetId,
        range: ssReadFrom,
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(ssReadFrom);
        testarr = response.values;
        if (testarr.length == 0) {
            console.log('No data found.');
        } else {
            console.log('imported');
            console.log(testarr);
            for (var i = 0; i < testarr.length; i++) {
                rows[i] = testarr[i][0];
            }
        }
    });
}

function sswrite(auth) { // this function writes a range to the spreadsheet
    var body = {
        values: values
    };
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.update({
        spreadsheetId: activeSpreadsheetId,
        range: ssReadFrom,
        valueInputOption: 'RAW',
        resource: body,
        auth: auth
    }, function(err, result) {
        if (err) {
            // Handle error
            console.log(err);
        } else {
            console.log('%d cells updated.', result.updatedCells);
        }
    });
}

// End of defining google apps scripts
// Define global variables
var drafted = 0;
var draftStart = 0;
var setupStart = 0;
var players = [];
var playersr = [];
var captains = [];
var picknum = 1;
var setupDraft = 0;
var wait = 0;
var reply = '';
var tree = '';
var seasonSize;
var seasonNum;
var draftMod;
var draftRound = 1;
var signupsOpen = false;
var motdSet = false;
var groupSend;
var groupId;
var ggId = [];
var ggLink = [];
var ggAdd;
var motd = "Sorry, there's no motd set right now!";
var lockChannelList = [];
var superlockChannelList = [];
var gScriptName;
var ssReadFrom;
var values = [];
var draftPickRound;
var draftSsDraftNum;
var modsMumbleList = [];
var mumbleSessionNum = [];
var mumbleSessionUsers = [];
var groupmeChatBridge = false;
var contentPieces;

const rl = readline.createInterface({ // creates cmd interface to interact with the bot
    input: process.stdin,
    output: process.stdout
});

// connect to the mumble server
console.log('Connecting to Mumble Server');
console.log('Connecting');
if (groupmeAuth == true){
request({
            method: 'POST',
            uri: 'https://api.groupme.com/v3/bots/post',
            body: JSON.stringify({ "bot_id" : groupmeListenId,"text": 'Bot has been initialized!' })
        }, function(error, response, body) {
			console.log(body);
		})
}

mumble.connect(mumbleUrl, options, function(error, connection) {
    if (error) { throw new Error(error); }

    connection.authenticate(botName);
    connection.on('initialized', function() {
		mumbleLogger.chat("Bot has connected and is ready to go!",{ 'Timestamp': getDateTime() });
        console.log('connection ready');
        connection.user.setSelfDeaf(false); // mute/deafens the bot
        connection.user.setComment(help); // sets the help statement as the comment for the bot
    });
	
	process.on('uncaughtException', function (exception) {
	console.log(exception);
	process.exit(0);
	});

    // Initialize slack/groupme connections
    if (slackAuth == true) {
        var web = new WebClient(slackToken);
    } else {
        console.log('Slack token was noot imported, you will not be able to use Slack functionality at this time. :c');
        var web;
    }
	
	if (ircAuth == true){
	var client = new irc.Client(ircServer, ircName, {
		channels: [ircChannel],
		sasl: true,
		nick: ircName,
		userName: ircName,
		password: ircPassword,
		stripColors: true,
		showErrors: false,
		autoRejoin: false
		});
		client.addListener('error', function(message) {
			console.error('ERROR: %s: %s', message.command, message.args.join(' '));
		});

		client.addListener('message#blah', function(from, message) {
			console.log('<%s> %s', from, message);
		});

		client.addListener('message', function(from, to, message) {
			console.log('%s => %s: %s', from, to, message);
			console.log(message);
			if (from == 'mods_slack1' && message.split(' ')[0] == '!ban'){
				if (ircBridge.indexOf(message.split(' ')[1]) > -1){
					ircBridgeBan.push(message.split(' ')[1]);
					ircBridge.splice(ircBridge.indexOf(message.split(' ')[1]),1);
					connection.userByName(message.split(' ')[1].sendMessage('You have been banned from using the NA Mumble Bridge!'));
					client.say('#tpmods',message.split(' ')[1]+' has been banned from the NA Mumble Bridge!');
					backupUsers();
				}
				else {
					ircBridgeBan.push(message.split(' ')[1]);
				}
			}
		
			if (to.match(/^[#&]/)) {
				for (var i=0; i < ircBridge.length ; i++){
					const messageCheck = message || '';
					const isMod = messageCheck[0] === '<';
					if (from == 'mods_slack1' && isMod){
						var tempMod =  message.split(' ')[0];
						tempMod = tempMod.substring(1,tempMod.length-1);
						var tempMessage = '';
						if (message.split(' ').length > 2) {
							for (i = 2; i <= message.split(' ').length - 1; i++) {
								tempMessage = tempMessage + ' ' + message.split(' ')[i];
							}
						message = message.split(' ')[1];
						connection.userByName(ircBridge[i]).sendMessage('#tpmods IRC Chat:<br/>[Mod]'+tempMod+': '+message);
						}
					else {
						connection.userByName(ircBridge[i]).sendMessage('#tpmods IRC Chat:<br/>'+from+': '+message);
					}
					}
				}
			}	
			else {
			// private message
			console.log('private message');
			}
			if (message == '!cat'){
				client.say('#tpmods',cats());
			}
		
		});
		client.addListener('pm', function(nick, message) {
			console.log('Got private message from %s: %s', nick, message);
		});
		client.addListener('join', function(channel, who) {
			console.log('%s has joined %s', who, channel);
		});
		client.addListener('part', function(channel, who, reason) {
			console.log('%s has left %s: %s', who, channel, reason);
		});
		client.addListener('kick', function(channel, who, by, reason) {
			console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
		});				
		} else {
		console.log('IRC info was not imported, you will not be able to use IRC functionality at this time. :c');
		var client;
	}
    if (groupmeAuth == true) {
        var incoming = new GroupMe.IncomingStream(groupmeAccessToken, groupmeUserId, null);
    } else {
        console.log('GroupMe auth was not imported, you will not be able to use GroupMe functionality at this time. :c');
        var incoming = rl;
    }

    incoming.on('connected', function() { // gets remaining info needed for bot to run.
        console.log("[IncomingStream 'connected']");

        API.Bots.index(groupmeAccessToken, function(err, ret) {
            if (!err) {
                var botdeets;
                for (var i = 0; i < ret.length; i++) {
                    if (ret[i].name == GMBOT) {
                        groupmeBotId = ret[i].groupmeBotId;
                    }
                }
                console.log("[API.Bots.index return] Firing up bot!", groupmeBotId);
            }
        });
    });

    incoming.on('disconnected', function() { // if disconnected from GroupMe API, attempts to reconnect.
        console.log("[IncomingStream 'disconnect']");
        var retryCount = 3;
        if (retryCount > 0 && groupmeChatBridge == true) { // if groupmeChatBridge is false, groupme functionality is disabled, so no reconnect attempts should be made.
            retryCount = retryCount - 1;
            incoming.connect();
        }
    })

    incoming.on('message', function(msg) {
        if (msg["data"] &&
            msg["data"]["subject"] &&
            msg["data"]["subject"]["text"]) { // error is thrown when attempting to access a message without data,subject, or text, so checks to make sure they all exist
            if (groupmeBotId && msg["data"]["subject"]["name"] != groupmeUsername && msg["data"]["subject"]["groupmeGroupId"] == groupmeGroupId) {
                connection.user.channel.sendMessage(msg["data"]["subject"]["text"]);
            }
        }
    });

    connection.on('userRemove', function(data) {
		if (typeof data != 'undefined'){
        if (data.actor != null && data.ban == false) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' kicked ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
			mumbleLogger.mlog(reply,{'Timestamp': getDateTime()});
            if (slackAuth == true) {
                sendtoslack(slackChannel, reply);
            }
        } else if (data.actor != null && data.ban == true) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' banned ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
			mumbleLogger.mlog(reply,{'Timestamp': getDateTime()});
            if (slackAuth == true) {
                sendtoslack(slackChannel, reply);
            }
        }
    }})

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
		mumbleLogger.mlog(state.name+" has disconnected.",{'Timestamp': getDateTime()});
		if (state.name == botName){
			process.exit(0);
		}
        if (modsMumbleList.indexOf(state.name) > -1) {
            modsMumbleList.splice(modsMumbleList.indexOf(state.name), 1);
        }
        if (greylist.indexOf(state.name) == -1) {
            users.splice(users.indexOf(state.name), 1);
        }
		if (ircBridge.indexOf(state.name) > -1){
			ircBridge.splice(ircBridge.indexOf(state.name), 1);
		}
        if (users.indexOf(null) > -1) {
            users.splice(users.indexOf(null), 1);
        }
        if (usersf.indexOf(state.name) > -1) {
            usersf.splice(usersf.indexOf(state.name), 1);
            updateuserarray(usersf, usersl);
        }
		}
    });

    rl.on('line', (input) => {
            connection.user.channel.sendMessage(input);
        }) //allows user to chat as the bot via command line

    /* var channels = [];
connection.on( 'channelState', function (state) {
if (channels.indexOf(state.channel_id) == -1){
	channels.push(state.channel_id);}
}); */ //used to get a list of channel ids, may be better as a tree function depending on the amount of channels on the server

    connection.on('user-priority-speaker', function(user, status, actor) {	
		if (typeof actor != 'undefined'){
		mumbleLogger.mlog(user.name+" had priority speaker status changed to "+status+" by "+actor.name,{'Timestamp': getDateTime()});
        if (whitelist.indexOf(actor.name) > -1 && status == true) {
            if (user.name == botName && user.channel.name != actor.channel.name) { // moves bot to the channel of the actor 
                user.moveToChannel(actor.channel);
                actor.channel.sendMessage(actor.name + ' has summoned me to this channel!');
            } else if (user.name == botName && user.channel.name == actor.channel.name) { // if bot is in the same channel as the actor, sends bot to home channel
                user.moveToChannel(connection.channelByName(botHome));
                actor.channel.sendMessage(actor.name + ' has sent me back home!');
            } else { // moves player to the channel of the bot
                user.moveToChannel(connection.user.channel);
                connection.user.channel.sendMessage(actor.name + ' has moved ' + user.name + ' to ' + connection.user.channel.name + '!');
            }
        }
		}
    });
	
	connection.on('user-mute', function(user,status,actor){
		mumbleLogger.mlog(user.name+" changed mute status to "+status+" by "+actor.name,{'Timestamp': getDateTime()});
	})
	connection.on('user-deaf', function(user,status,actor){
		mumbleLogger.mlog(user.name+" changed deaf status to "+status+" by "+actor.name,{'Timestamp': getDateTime()});
	})
	connection.on('user-recording', function(user,status){
		mumbleLogger.mlog(user.name+" changed recording status to "+status,{'Timestamp': getDateTime()});
	})
	connection.on('self-mute', function(user,status){
		mumbleLogger.mlog(user.name+" has set self-mute status to "+status,{'Timestamp': getDateTime()});
	})
	connection.on('self-deaf', function(user,status){
		mumbleLogger.mlog(user.name+" has set self-deaf status to "+status,{'Timestamp': getDateTime()});
	})
	connection.on('user-suppress', function(user,status,actor){
		mumbleLogger.mlog(user.name+" changed suppressed status to "+status+" by "+actor.name,{'Timestamp': getDateTime()});
	})
    connection.on('message', function(message, actor, scope) {
        console.log(actor.name);
        message = message.replace(/\n/g, ""); // consolidates message to one line
        reply = "";
        const privateMessage = scope === 'private'; // scope defines how the bot received the message
        const content = message || '';
        const isCommand = content[0] === '!';
        const isChat = content[0] === '@';
        contentPieces = content.slice(1, content.length).split(' ');
        const command = contentPieces[0].slice(0, contentPieces[0].length).split("<br")[0].split("<p")[0].toLowerCase();
        var playerd = contentPieces[1];
		if (privateMessage){
		mumbleLogger.chat('PM from '+actor.name+': '+message,{ 'Timestamp': getDateTime() });
		}
		else{
		mumbleLogger.chat('CM from '+actor.name+': '+message,{ 'Timestamp': getDateTime() });
		}
        if (contentPieces.length > 2) {
            for (i = 2; i <= contentPieces.length - 1; i++) {
                playerd = playerd + ' ' + contentPieces[i];
            }
        } // arg playerd may have multiple words, so combine everything afters command into one var
        console.log(message);
        if (privateMessage == false && isChat == true && groupmeChatBridge == true) {
            var playerd = contentPieces[0];
            if (contentPieces.length > 1) {
                for (i = 1; i <= contentPieces.length - 1; i++) {
                    playerd = playerd + ' ' + contentPieces[i];
                }
            }
            if (playerd == undefined) {
                connection.user.channel.sendMessage("Sorry, there was nothing to respond to!");
				mumbleLogger.chat("Bot response: "+"Sorry, there was nothing to respond to!",{ 'Timestamp': getDateTime() });
            } else if (groupmeAuth == true) {
                playerd = '@zo ' + playerd;

                function hi() {
                    console.log("Success!");
                }
                API.Messages.create(groupmeAccessToken, groupmeGroupId, {
                    message: {
                        text: playerd,
                        attachments: [{
                            type: "mentions",
                            groupmeUserIds: [46185459],
                            loci: [
                                [0, 3]
                            ]
                        }]
                    }
                }, hi);
            }
            console.log(playerd);
        }
        if (privateMessage == false && connection.user.channel.name == "Draft Channel") {
            connection.channelByName('Spectating Lounge [Open to all]').sendMessage(actor.name + ': ' + message);
			mumbleLogger.chat("Bot forwarded message to Spectating Lounge",{ 'Timestamp': getDateTime() });
        }
        if (isCommand && privateMessage) {
            switch (command) {
				case 'active':
					if (whitelist.indexOf(actor.name) > -1 || tournamentRunners.indexOf(actor.name) > -1){
						reply = "The active tournament is "+activeTournament; 
					}
					else {
						reply = tohelp;
					}
					break;
                case 'backup': // this case is uneeded since function backup runs after each write/splice, but is kept as a redundant measure.
                    if (whitelist.indexOf(actor.name) > -1) {
                        backupLinks();
						backupMail();
						backupUsers();
						backupWelcome();
                        reply = "Everything has been backed up!";
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'ban': // bans player from the server, playerd defines the reason and lists the actor name at the end.
                    if (whitelist.indexOf(actor.name) > -1 || mods.indexOf(actor.name) > -1 || pseudoMods.indexOf(actor.name) > -1) {
                        var playerd = contentPieces[2];
                        if (contentPieces.length > 3) {
                            for (i = 3; i <= contentPieces.length - 1; i++) {
                                playerd = playerd + ' ' + contentPieces[i];
                            }
                        }
                        if (playerd == undefined) {
                            playerd = '';
                        }
                        playerd = playerd + ' [banned by ' + actor.name + ']';
                        connection.userByName(contentPieces[1]).ban(playerd);
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'blacklist': // adds user to the blacklist, playerd defines the user.
                    if (whitelist.indexOf(actor.name) > -1) {
                        blacklist.push(playerd);
                        reply = 'Added ' + playerd + ' to the blacklist!';
                        backupUsers();
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
                case 'chat': // enables/disables the chat bridge to groupme
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (groupmeAuth == true) {
                            if (groupmeChatBridge == false) {
                                groupmeChatBridge = true;
                                connection.user.channel.sendMessage("<br/>Chat mode has been enabled! To chat with the bot, preface your chat with the @ symbol like this @hi bot!");
								mumbleLogger.chat("Bot activated GroupMe Bridge",{ 'Timestamp': getDateTime() });
                                incoming.disconnect();
                                incoming.connect();
                            } else {
                                groupmeChatBridge = false;
                                connection.user.channel.sendMessage("<br/>Chat mode has been disabled! :c");
								mumbleLogger.chat("Bot deactivated GroupMe Bridge",{ 'Timestamp': getDateTime() });
                                incoming.disconnect();
                            }
                        } else {
                            connection.user.channel.sendMessage("GroupMe functionality has not been enabled! Chat mode is not activated. :c");
							mumbleLogger.chat("Bot failed to activate GroupMe bridge due to lack of API key.",{ 'Timestamp': getDateTime() });
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'draft': // draftStart=1 when draft is active, playerd defines the player to draft in the tournament.
                    if (draftStart == 0) {
                        reply = tohelp;
                    } else if (actor.channel.name != connection.user.channel.name) { // to prevent spam, captain must be in the same channel as the bot to draft
                        reply = 'You are not a captain, please do not use this command.';
                    } else if (playersr.length !== 0 && draftStart == 1 && drafted == 1) {
                        reply = 'A pick is currently being processed, please wait...';
                    } else if (playersr.length !== 0 && draftStart == 1 && drafted == 0) {
                        var playerdIndex = playersr.indexOf(playerd);
                        if (playerdIndex > -1) {
                            playersr.splice(playerdIndex, 1);
                            drafted = 1;
                            draftplayer(playerd);
                        }
                        /*else if (isNumber(playerd) == true && playerd > 0 && playerd < 120) {
					var playerdi = playerd;
					if (players.length <= playerdi-draftMod){
						playerd = players[playerdi-draftMod];
						playerdIndex = playersr.indexOf(playerd);
						if (playerdIndex > -1) {
							reply = 'Drafted ' + playerd;
							playersr.splice(playerdIndex,1); 
							drafted = 1;}
						else {
					reply = 'That player has already been taken! :c';}}}
					*/ // this is supposed to allow captains to draft by row number, unsure how to implement			
                        else if (players.indexOf(playerd) == -1) {
                            reply = 'That player has already been taken! :c';
                        } else {
                            reply = 'That player does not exist! Please make sure spelling/capitalization is correct!';
                        }
                    } else {
                        reply = 'The draft has been completed! Thanks for drafting! C:';
                    }
                    break;
                case 'find': // gives a url to a player on the server, playerd defines user to find, case-insensitive.
                    if (playerd != undefined) {
                        if (usersl.indexOf(playerd.toLowerCase()) > -1) {
                            playerd = usersf[usersl.indexOf(playerd.toLowerCase())];
                        }
                        if (connection.userByName(playerd) == undefined) {
                            reply = 'Sorry, ' + playerd + ' could not be found.';
                        } else {
                            var parentChannels = [];
                            parentChannels.unshift(connection.userByName(playerd).channel.name);
                            parentChannels.unshift(connection.userByName(playerd).channel.parent.name);
                            while (connection.channelByName(parentChannels[0]).parent.name != 'North American TagPro Mumble') {
                                parentChannels.unshift(connection.channelByName(parentChannels[0]).parent.name);
                            }
                            var mumbleUrlSet = 'mumble://'+mumbleUrl;
                            for (i = 0; i < parentChannels.length; i++) {
                                mumbleUrlSet = mumbleUrlSet + '/' + parentChannels[i].replace(/ /g, "%20");
                            }
                            reply = '<br/>' + playerd + ' was found in <a href="' + mumbleUrlSet + '"><span style="color:#39a5dd">' + parentChannels[parentChannels.length - 1] + '</span></a>';
                        }
                    } else {
                        reply = '<br/> A user could not be found! Please make sure to specify a user in the command like this: !find Cryanide';
                    }
                    break;
                case 'getmail': // manual getmail command, playerd is uneeded in this case.
                    getmail(actor);
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
                case 'greet': // defines a greeting for the actor which is sent on every connection to the server, playerd defines the message.
                    if (playerd == undefined) {
                        reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';
                    } else {
                        if (welcomeUser.indexOf(actor.name) > -1) {
                            welcomeMessage[welcomeUser.indexOf(actor.name)] = playerd;
                        } else {
                            welcomeUser.push(actor.name);
                            welcomeMessage.push(playerd);
                        }
                        backupWelcome();
                        reply = 'Your greeting has been set! ' + botName + ' will send you this message each time you connect to the server! c:';
                    }
                    break;
                case 'greetcat': // sets the greeting for the actor to a cat which is sent on every connection to the server, playerd is unneeded in this context.
                    if (welcomeUser.indexOf(actor.name) > -1) {
                        welcomeMessage[welcomeUser.indexOf(actor.name)] = 'this_is_supposed_to_be_a_cat-217253';
                    } else {
                        welcomeUser.push(actor.name);
                        welcomeMessage.push('this_is_supposed_to_be_a_cat-217253');
                    }
                    backupWelcome();
                    reply = botName + ' will give you a cat each time you connect to the server! c:';
                    break;
                case 'group': // creates group on a defined server. playerd is the server, ggadd is the optional group name which is stored on the bot.
                    if (contentPieces.length > 2) { // !group server name
                        ggAdd = contentPieces[2];
                    } else {
                        ggAdd = false;
                    }
                    if (contentPieces.length > 3) {
                        for (i = 3; i <= contentPieces.length - 1; i++) {
                            ggAdd = ggAdd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = contentPieces[1];
                    if (playerd == undefined) {
                        playerd = 'sphere';
                    } else {
                        playerd = playerd.toLowerCase();
                    }
                    createTagProGroup(playerd, ggAdd, actor, false, "r",[]);
                    break;
                case 'groupc': // creates comp group
                    if (contentPieces.length > 3) { // !groupc server map name
                        ggAdd = contentPieces[3];
                    } else {
                        ggAdd = false;
                    }
                    if (contentPieces.length > 4) {
                        for (i = 4; i <= contentPieces.length - 1; i++) {
                            ggAdd = ggAdd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = contentPieces[1];
                    if (playerd == undefined) {
                        playerd = 'sphere';
                    } else {
                        playerd = playerd.toLowerCase();
                    }
                    createTagProGroup(playerd, ggAdd, actor, true, contentPieces[2].toLowerCase(),[]);
                    break;
                case 'groupt': // creates comp group for the tourney
                    if (contentPieces.length > 1) {
                        ggAdd = contentPieces[1];
                    } else {
                        ggAdd = false;
                    }
                    if (contentPieces.length > 2) {
                        for (i = 2; i <= contentPieces.length - 1; i++) {
                            ggAdd = ggAdd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = 'sphere';
                    createTagProGroup(playerd, ggAdd, actor, true, ssMapName.replace(' ', '_').toLowerCase(),[]);
                    break;
                case 'help': // sends help info to the actor.
                    reply = help;
                    break;
                case 'here': // moves the bot to the channel of the actor.
                    if (whitelist.indexOf(actor.name) > -1) {
                        connection.user.moveToChannel(actor.channel);
                        actor.channel.sendMessage(actor.name + ' has summoned me to this channel!');
						mumbleLogger.chat("Bot was summoned to "+actor.channel.name+" by "+actor.name,{ 'Timestamp': getDateTime() });
                    } else {
                        actor.sendMessage(tohelp);
						mumbleLogger.chat("Bot response: "+tohelp,{ 'Timestamp': getDateTime() });
                    }
                    break;
                case 'home': // moves the bot back to a predefined home channel.
                    if (whitelist.indexOf(actor.name) > -1) {
                        connection.user.moveToChannel(botHome);
                        connection.channelByName(botHome).sendMessage(actor.name + ' has sent me to this channel!');
                    } else {
                        actor.sendMessage(tohelp);
						mumbleLogger.chat("Bot response: "+tohelp,{ 'Timestamp': getDateTime() });
                    }
                    break;
                case 'info': // displays info about the bot
                    reply = botInfo;
                    break;
                case 'lock': // prevents users from entering the channel [note move to does not work if the bot does not have permissions to move]
                    if (whitelist.indexOf(actor.name) > -1 || mods.indexOf(actor.name) > -1 || pseudoMods.indexOf(actor.name) > -1) {
                        if (lockChannelList.indexOf(actor.channel.name) == -1 && superlockChannelList.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has put this channel on lockdown! No new users will be allowed unless moved by a whitelisted user.');
							mumbleLogger.chat(actor.channel.name+" was put on lockdown by "+actor.name,{ 'Timestamp': getDateTime() });
                            console.log(actor.channel.name + ' has been put on lockdown');
                            lockChannelList.push(actor.channel.name);
                        } else if (lockChannelList.indexOf(actor.channel.name) == -1 && superlockChannelList.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has downgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
                            lockChannelList.push(actor.channel.name);
                            console.log(actor.channel.name + ' has been downgraded to lockdown');
							mumbleLogger.chat(actor.channel.name+" has been downgraded to lockdown by "+actor.name,{ 'Timestamp': getDateTime() });
                            superlockChannelList.splice(superlockChannelList.indexOf(actor.channel.name), 1);
                        } else if (lockChannelList.indexOf(actor.channel.name) > -1 || superlockChannelList.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has lifted the channel lockdown! Users may now freely enter and leave.');
                            lockChannelList.splice(lockChannelList.indexOf(actor.channel.name), 1);
                            superlockChannelList.splice(superlockChannelList.indexOf(actor.channel.name), 1);
                            console.log(actor.channel.name + ' has been removed from lockdown');
							mumbleLogger.chat(actor.channel.name+" has been removed from lockdown by "+actor.name,{ 'Timestamp': getDateTime() });
                        }
                    } else {
                        actor.sendMessage(tohelp);
						mumbleLogger.chat("Bot response: "+tohelp,{ 'Timestamp': getDateTime() });
                    }
                    break;
                case 'lock+': // prevents users from entering or leaving the channel [note, move back does not work if bot does not have permissions to move]
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (lockChannelList.indexOf(actor.channel.name) == -1 && superlockChannelList.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has put this channel on super lockdown! No new users will be allowed to enter or leave unless moved by a whitelisted user.');
                            superlockChannelList.push(actor.channel.name);
                            console.log(actor.channel.name + ' has been put on lockdown+');
							mumbleLogger.chat(actor.channel.name+" has been put on lockdown+ by "+actor.name,{ 'Timestamp': getDateTime() });
                        } else if (lockChannelList.indexOf(actor.channel.name) > -1 && superlockChannelList.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has upgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
                            console.log(actor.channel.name + ' has been upgraded to lockdown+');
							mumbleLogger.chat(actor.channel.name+" has been upgraded to lockdown+ by "+actor.name,{ 'Timestamp': getDateTime() });
                            superlockChannelList.push(actor.channel.name);
                            lockChannelList.splice(superlockChannelList.indexOf(actor.channel.name), 1);
                        } else if (lockChannelList.indexOf(actor.channel.name) > -1 || superlockChannelList.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has lifted the channel lockdown! Users may now freely enter and leave.');
                            console.log(actor.channel.name + ' has been removed from lockdown+');
							mumbleLogger.chat(actor.channel.name+" has been removed from lockdown+ by "+actor.name,{ 'Timestamp': getDateTime() });
                            lockChannelList.splice(lockChannelList.indexOf(actor.channel.name), 1);
                            superlockChannelList.splice(superlockChannelList.indexOf(actor.channel.name), 1);
                        }
                    } else {
                        actor.sendMessage(tohelp);
						mumbleLogger.chat("Bot response: "+tohelp,{ 'Timestamp': getDateTime() });
                    }
                    break;
                case 'locklist':
                    reply = "Here are the channels currently on lockdown: " + lockChannelList;
                    break;
                case 'lock+list':
                    reply = "Here are the channels currently on superlockdown: " + superlockChannelList;
                    break;
                case 'kick': // kicks player from the server, playerd defines reason. [Bot needs permission to kick]
                    if (whitelist.indexOf(actor.name) > -1 || mods.indexOf(actor.name) > -1 || pseudoMods.indexOf(actor.name) > -1) {
                        var playerd = contentPieces[2];
                        if (contentPieces.length > 3) {
                            for (i = 3; i <= contentPieces.length - 1; i++) {
                                playerd = playerd + ' ' + contentPieces[i];
                            }
                        }
                        if (playerd == undefined) {
                            playerd = '';
                        }
                        playerd = playerd + ' [kicked by ' + actor.name + ']';
                        connection.userByName(contentPieces[1]).kick(playerd);
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'mail': // creates mail to send to another user.		
                    if (blacklist.indexOf(actor.name) == -1 && playerd != undefined) {
                        var mailUserTemp = contentPieces[1];
                        var mailMesTemp = contentPieces[2];
                        for (i = 3; i <= contentPieces.length - 1; i++) {
                            mailMesTemp = mailMesTemp + ' ' + contentPieces[i];
                        }
                        mailTimestamp.push(getDateTime());
                        mailUser.push(mailUserTemp.toLowerCase());
                        mailSender.push(actor.name);
                        mailMessage.push(mailMesTemp);
                        reply = 'Your mail has been successfully created! Your receiver will receive it when they enter the server or use the !getmail command! c:';
                        backupMail();
                    } else if (playerd == undefined) {
                        reply = 'A mail message was not detected! Please add a message in the form !mail user contents [Ex. !mail Cryanide hi]';
                    } else {
                        reply = "You don't have permission to do that! :c";
                    }
                    break;
                case 'map': // sends the map link for the tournament
                    if (setupStart == 1) {
                        reply = '<br/>The map for tonight is: <a href="' + ssMapLink + '"><b><i><span style="color:#00557f">' + ssMapName + '</span></i></b></a>';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
				case 'mod':
					if (whitelist.indexOf(actor.name) > -1){
						pseudoMods.push(playerd);
                        reply = 'Added ' + playerd + ' to the Pseudo Mod group!';
                        backupUsers();
					}
					else {
						reply = tohelp;
					}
					break;
				case 'mods':
                    reply = '<br/> Here are the mods currently on: <br/>' + modsMumbleList + '<br/>To find any of these mods, use the !find command! c:';
                    break;
                case 'motd': // sends the message of the day
                    reply = motd;
                    break;
                case 'move':
                    connection.userByName(playerd).moveToChannel(actor.channel.name);
                    break;
                case 'qak': // qak
                    reply = 'qak';
                    break;
                    // break point to add ranked pug commands later.
				case 'reboot':
					if (whitelist.indexOf(actor.name) > -1) {
						process.exit(0);
					}
					else {
						reply = tohelp;
					}
					break;
                case 'setgreet': // allows a whitelisted actor to set a greeting for a specific user
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (contentPieces.length > 2) {
                            ggAdd = contentPieces[2];
                        } else {
                            ggAdd = false;
                        }
                        if (contentPieces.length > 3) {
                            for (i = 3; i <= contentPieces.length - 1; i++) {
                                ggAdd = ggAdd + ' ' + contentPieces[i];
                            }
                        }
                        playerd = contentPieces[1];
                        if (playerd == undefined) {
                            reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';
                        } else {
                            if (welcomeUser.indexOf(playerd) > -1) {
                                welcomeMessage[welcomeUser.indexOf(playerd)] = ggAdd;
                            } else {
                                welcomeUser.push(playerd);
                                welcomeMessage.push(ggAdd);
                            }
                            backupWelcome();
                            reply = 'Greeting has been set for ' + playerd + '! They will receive this message each time they connect. c:';
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'setgreetcat': // allows a whitelisted user to set a cat greeting for a specific user
                    if (whitelist.indexOf(actor.name) > -1) {
                        playerd = contentPieces[1];
                        if (playerd == undefined) {
                            reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';
                        } else {
                            if (welcomeUser.indexOf(playerd) > -1) {
                                welcomeMessage[welcomeUser.indexOf(playerd)] = 'this_is_supposed_to_be_a_cat-217253';
                            } else {
                                welcomeUser.push(playerd);
                                welcomeMessage.push('this_is_supposed_to_be_a_cat-217253');
                            }
                            backupWelcome();
                            reply = 'Greeting has been set for ' + playerd + '! They will receive a cat each time they connect. c:';
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
				case 'settournament':
					if (whitelist.indexOf(actor.name) > -1 || tournamentRunners.indexOf(actor.name) > -1){
						if (tournamentLabel.indexOf(playerd.toLowerCase()) > -1){
							reply = "Setting active tournament to "+playerd.toLowerCase();
							setTournament(playerd.toLowerCase());
						}
						else {
							reply = "Sorry, I didn't recognize that tournament. Please try again!"
						}
					}
					else {
						reply = tohelp;
					}
					break;
                case 'setupdraft': // sets up the draft, playerd is uneeded.
                    if (whitelist.indexOf(actor.name) > -1 && gAuth == true) {
                        setupDraft = 1;
                        reply = 'Setting up draft now!';
                        draftsetup();
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'setupsheet': // sets up the form and sheet, playerd is uneeded.
                    if (whitelist.indexOf(actor.name) > -1 && gAuth == true) {
                        setupStart = 1;
                        reply = 'Setting up sheet now!';
                        sheetsetup();
                        signupsOpen = true;
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'signups': // replies with the signup link, playerd is uneeded.
                    if (setupStart == 1) {
                        reply = '<a href="' + sgnLink + '"><b><span style="color:#aa0000"><br/>Click here for the signups!</span></b></a>';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'spreadsheet': // replies with the spreadsheet link, playerd is uneeded.
                    if (setupStart == 1) {
                        reply = '<br/><a href="' + ssLink + '"><b><span style="color:#00007f">Click here for the spreadsheet!</span></b></a>';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'startdraft': // starts the draft and retrieves players, to be done after trades are complete, playerd is uneeded.
                    draftstart();
                    break;
                case 'stop': // adds users to the greylist, which prevents them from receiving automated messages from the bot, playerd is uneeded.
                    if (greylist.indexOf(actor.name) == -1) {
                        greylist.push(actor.name);
                        backupUsers();
                        reply = "You've been added to the greylist! You will no longer receive automated messages from TToC_BOT when you connect.";
                    } else {
                        greylist.splice(greylist.indexOf(actor.name), 1);
                        backupUsers();
                        reply = "You've been removed from the greylist! You will now receive automated message from " + botName + " when you connect.";
                    }
                    break;
                case 'stream': // test case right now, but allows for treeing the motd, playerd is uneeded.
                    for (i = 0; i < users.length; i++) {
                        //connection.userByName(users[i]).sendMessage('this is a quick test of the '+botName+' tree function, please ignore c:');
                        console.log(users[i]);
                    }
                    break;
                case 'time': // shows the time
                    if (setupStart == 1) {
                        reply = 'TToC was treed at 9:30 PM CST and the draft will start at around 10:15 PM CST.';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'trade': // trades two captains based on their position on the draft board. Requires two numbers for each trading party.
                    if (whitelist.indexOf(actor.name) > -1 && gAuth == true) {
                        values = [];
                        var tradec1 = contentPieces[1] - 1;
                        var tradec2 = contentPieces[2] - 1;
                        if (tradec1 > tradec2) {
                            playerd = tradec2;
                            tradec2 = tradec1;
                            tradec1 = playerd;
                        }
                        tradec1 = captains[tradec1];
                        tradec2 = captains[tradec2];
                        captains[captains.indexOf(tradec2)] = tradec1;
                        captains[captains.indexOf(tradec1)] = tradec2;
                        playerd = 6 + 6 - 1;
                        ssReadFrom = "'S-" + seasonNum + "'!N6:N" + playerd;
                        for (i = 0; i < 6; i++) {
                            values.push([captains[i]]);
                        }

                        function random8() {
                            authorize(JSON.parse(gappkey), sswrite);
                        }
                        random8();
                        connection.user.channel.sendMessage('Successfully switched captains ' + tradec1 + ' and ' + tradec2 + '!');
                        connection.channelByName('Spectating Lounge [Open to all]').sendMessage('captains ' + tradec1 + ' and ' + tradec2 + ' have traded!');
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'tree': // incomplete, allows a whitelisted user to tree out signups, playerd is uneeded
                    if (whitelist.indexOf(actor.name) > -1) {
                        reply = 'look a tree';
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'updatelinks': // updates links from the spreadsheet, playerd is uneeded
                    if (whitelist.indexOf(actor.name) > -1 && gAuth == true && signupsOpen == false) {
                        console.log('updating links!');
                        reply = 'Updating links!';
                        updatelinks();
                        setupStart = 1;
                        signupsOpen = true;
                    } 
					else if (whitelist.indexOf(actor.name) > -1 && gAuth == true && signupsOpen == true) {
						signupsOpen = false;
						reply = 'Tournament links have been turned off!';
					}
					else {
						reply = tohelp;
                    }
                    break;
                case 'updatemotd': // updates var motd to a line on motd.txt, playerd defines which number to utilize, defaults to 0
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (motdSet == false) {
                            motdSet = true;
                            playerd = parseInt(contentPieces[1]);
                            motd = fs.readFileSync(path.join(__dirname,'/bot_data/','motd_system.txt')).toString().split("\n");
                            console.log(playerd);
                            console.log(Number.isInteger(playerd));
                            console.log(motd.length);
                            if (Number.isInteger(playerd) == true && playerd <= motd.length - 1 && playerd >= 0) {
                                motd = motd[playerd];
                            } else {
                                motd = motd[0];
                            }
                            motd = motd + greyMessage;
                            reply = 'motd has been updated and turned on!';
                        } else {
                            motdSet = false;
                            reply = 'motd has been turned off!';
                            motd = "Sorry, there's no motd set right now!";
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'whitelist': // adds a user to the whitelist, which allows them to access whitelist only commands, playerd defines user to add
                    if (whitelist.indexOf(actor.name) > -1) {
                        whitelist.push(playerd);
                        reply = 'Added ' + playerd + ' to the whitelist!';
                        backupUsers();
                    } else {
                        reply = tohelp;
                    }
                    break;
                default:
                    reply = tohelp;
                    break;
            }
            var noReply = ['getmail', 'group', 'lock', 'lock+', 'here', 'trade', 'move'];
            if (noReply.indexOf(command) == -1 || reply != '') {
                console.log(reply);
				mumbleLogger.chat("Bot response: "+reply,{ 'Timestamp': getDateTime() });
                actor.sendMessage(reply);
            }
        }
		else if (privateMessage && ircBridge.indexOf(actor.name) > -1){
			client.say('#tpmods',actor.name+': '+message);
		}
    });

    connection.on('error', function(MumbleError) { //incomplete, error event when something goes wrong through mumble, need to add parsing of error
        console.log(MumbleError.name);
		mumbleLogger.error("Mumble Error: "+MumbleError.name,{'Timestamp': getDateTime()});
		process.exit(0);		
    })

    connection.on('user-connect', function(user) { // user-connect is the event emitted when a user connects to the server
		if (typeof user != 'undefined'){
		mumbleLogger.mlog(user.name+" has connected.",{'Timestamp': getDateTime()});
        if (mailUser.indexOf(user.name.toLowerCase()) > -1) { // sends mail if user has mail to collect.
            user.sendMessage("Howdy " + user.name + "! I've been keeping some cool mail from other people for you, let me go get it!");
            getmail(user);
			mumbleLogger.chat("Bot retrieved mail for "+user.name,{ 'Timestamp': getDateTime() });
        }
        if (signupsOpen == true && greylist.indexOf(user.name) == -1) { // if a tournament is running, signups are sent to the player
            user.sendMessage("<br/>TToC signups are currently open for " + ssMapName + "! If you want to signup, message me !signups or !spreadsheet<br/><br/>(If you don't want these automated messages, message the !stop command to me)");
			mumbleLogger.chat("Automated signups sent to "+user.name,{ 'Timestamp': getDateTime() });
        } else if (greylist.indexOf(user.name) == -1 && signupsOpen == false && motdSet == true) { // sends the motd if active
            user.sendMessage(motd);
			mumbleLogger.chat("motd sent to "+user.name,{ 'Timestamp': getDateTime() });
        } else if (welcomeUser.indexOf(user.name) > -1 && signupsOpen == false && motdSet == false) { // sends the user's predefined welcome message
            if (welcomeMessage[welcomeUser.indexOf(user.name)] == 'this_is_supposed_to_be_a_cat-217253') {
                user.sendMessage("<br/>" + botName + " sends a cat to say hi!<br/><br/>" + cats() + "<br/>");
            } else {
                user.sendMessage(welcomeMessage[welcomeUser.indexOf(user.name)]);
            }
			mumbleLogger.chat("Bot sent custom welcome message to "+user.name,{ 'Timestamp': getDateTime() });
        } else if (greylist.indexOf(user.name) == -1 && signupsOpen == false && motdSet == false) { // default message sent to every player on connect.
            //user.sendMessage("<br/>"+botName+" sends a cat to say hi!<br/><br/>"+cats()+"<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)");
        }
		}
    });

    connection.on('user-move', function(user, fromChannel, toChannel, actor) { // user-move is the event emitted when a user switches channels
		if (typeof actor != 'undefined'){
		if ((lockChannelList.indexOf(toChannel.name) > -1 || superlockChannelList.indexOf(toChannel.name) > -1) && actor.name != botName && (whitelist.indexOf(actor.name) == -1 && mods.indexOf(actor.name) == -1 && pseudoMods.indexOf(actor.name) == -1)) { // prevents user from entering if channel is locked.
            user.moveToChannel(botMoveTo);
            user.sendMessage('Sorry, you cannot enter this channel right now. :c');
            connection.channelByName(toChannel.name).sendMessage(user.name + ' was prevented from entering this channel!');
        } else if (superlockChannelList.indexOf(fromChannel.name) > -1 && actor.name != botName && (whitelist.indexOf(actor.name) == -1 && mods.indexOf(actor.name) == -1 && pseudoMods.indexOf(actor.name) == -1)) { // prevents user from leaving is channel is on super lockdown.
            user.moveToChannel(fromChannel.name);
            user.sendMessage('Sorry, you cannot leave this channel right now. :c');
            connection.channelByName(fromChannel.name).sendMessage(user.name + ' was prevented from leaving this channel!');
        } else if (connection.user.channel.name == toChannel.name && user.name != botName && actor.name != botName) { // if user has mail, sends a message to remind them to collect it.
            connection.user.channel.sendMessage('Welcome to ' + toChannel.name + ' ' + user.name + '!');
        }
        if (mailUser.indexOf(user.name.toLowerCase()) > -1) {
            user.sendMessage("This is an automated reminder from " + botName + " that you have some mail! Message !getmail to me when you're ready to receive it! c:");
        }
		}
    });

    function sheetsetup() { // sets up the form and sheet for a season.
        console.log('setupsheet has been activated!');
        console.log('Running Form Setup Script');

        function random1() {
            gScriptName = 'FormSetup';
            authorize(JSON.parse(gappkey), gscriptrun);
        }

        function random2() {
            gScriptName = 'SheetSetup';
            authorize(JSON.parse(gappkey), gscriptrun);
        }
        random1();
        setTimeout(random2, 15000);

        updatelinks();
        setTimeout(backupLinks, 5000);
    }

    function draftsetup() { // sets up a draft for a season.
        console.log('setupdraft has been activated!');
        console.log('Running Draft Setup Script');
        gScriptName = 'DraftBoardSetup';
        authorize(JSON.parse(gappkey), gscriptrun);

        function random11() {
            ssReadFrom = "'S-" + seasonNum + "'!T3";
            rows = [];
            authorize(JSON.parse(gappkey), ssread);
        }

        function random12() {
            seasonSize = rows[0];
            console.log(seasonSize);
            console.log(rows);
            playerd = parseInt(seasonSize) + 5;
            console.log(seasonSize);
            ssReadFrom = "'S-" + seasonNum + "'!N6:N" + playerd;
            authorize(JSON.parse(gappkey), ssread);
            for (i = 0; i < seasonSize; i++) {
                captains[i] = rows[i];
            }
        }
        setTimeout(random11, 10000);
        setTimeout(random12, 15000);
    }

    function draftstart() { // concludes trading period and starts draft
        console.log('draftstart has been activated!');
        console.log('Starting Draft!');
        draftRound = 1;
        draftStart = 1;
        drafted = 0;
        switch (parseInt(seasonSize)) { // draftMod defines where to start getting signups from.
            case 3:
                draftMod = 7 + 5;
                break;
            case 4:
                draftMod = 13 + 5;
                break;
            case 6:
                draftMod = 16 + 5;
                break;
            case 8:
                draftMod = 20 + 5;
                break;
            case 9:
                draftMod = 20 + 5;
                break;
            case 12:
                draftMod = 23 + 5;
                break;
            case 16:
                draftMod = 30 + 5;
                break;
            case 18:
                draftMod = 32 + 5;
                break;
            case 21:
                draftMod = 35 + 5;
                break;
            case 24:
                draftMod = 38 + 5;
                break;
            default:
                draftMod = -1;
                break;
        }
        playerd = parseInt(draftMod) + 4 * parseInt(seasonSize);
        ssReadFrom = "'S-" + seasonNum + "'!" + "M" + draftMod + ":M" + playerd;
        authorize(JSON.parse(gappkey), ssread);
        players = rows;
        for (i = 0; i < seasonSize; i++) {
            players.splice(players.indexOf(captains[i]), 1);
        }
        playersr = players;
    }

    function backupLinks() { // backs up data.
        console.log('backing up spreadsheet links!');
        rows = [tournamentName, seasonNum,tournamentServer, ssMapName, ssMapLink, sgnLink, ssLink];
        fs.writeFileSync(path.join(__dirname,'/bot_data/','tournament_info.txt'), rows.join('\n'));
        console.log('spreadsheet links have been backed up!');
    }
	
	function backupMail(){
		console.log('backing up mail system!');
		splitParts = [];
        for (var i = 0; i < mailTimestamp.length; i++) {
            splitParts[i] = mailTimestamp[i] + ' ' + mailSender[i] + ' ' + mailUser[i] + ' ' + mailMessage[i];
        }
        fs.writeFileSync(path.join(__dirname,'/bot_data/','mail_system.txt'), splitParts.join('\n'));
		console.log('mail system has been backed up!');
	}
	
	function backupUsers(){
		console.log('backing up usergroups!');
		fs.writeFileSync(path.join(__dirname,'/bot_data/','usergroups.txt'), whitelist.join(' ') + '\n' + mods.join(' ') + '\n' + pseudoMods.join(' ') + '\n' + greylist.join(' ') + '\n' + blacklist.join(' ')+ '\n'+ rPlayerBan.join(' ') + '\n' + ircBridgeBan.join(' ') + '\n' + 'End of user groups');
		console.log('usergroups have been backed up!');
	}
	
	function backupWelcome(){
		console.log('backing up welcome system!');
		splitParts = [];
        for (var i = 0; i < welcomeUser.length; i++) {
            splitParts[i] = welcomeUser[i] + ' ' + welcomeMessage[i];
        }		
        fs.writeFileSync(path.join(__dirname,'/bot_data/','welcome_system.txt'), splitParts.join('\n'));
		console.log('welcome system has been backed up!');
	}
    function draftplayer(playerd) { // interface with google sheets to write player name on the draft board
        console.log(playerd + ' is being drafted!');
        draftPickRound = picknum % seasonSize;
        if (draftPickRound == 0 && draftRound == 1) {
            draftPickRound = seasonSize;
        } else if (draftPickRound == 0 && (draftRound == 2 || draftRound == 3)) {
            draftPickRound = 1;
        } else if (draftRound > 1 && draftPickRound != seasonSize) {
            draftPickRound = seasonSize - draftPickRound + 1;
        }
        if (picknum == seasonSize + 1) {
            draftPickRound = seasonSize;
        }
        draftSsDraftNum = draftPickRound + 5;
        switch (draftRound) {
            case 1:
                picknumcolumn = 'O';
                break;
            case 2:
                picknumcolumn = 'P';
                break;
            case 3:
                picknumcolumn = 'Q';
                break;
        }
        ssReadFrom = "'S-" + seasonNum + "'!" + picknumcolumn + draftSsDraftNum;
        values = [
            [playerd]
        ];

        function random5() {
            authorize(JSON.parse(gappkey), sswrite);
        }
        random5();
        connection.user.channel.sendMessage(playerd + ' has been drafted by ' + captains[draftPickRound - 1] + '!');
        connection.channelByName('Spectating Lounge [Open to all]').sendMessage(playerd + ' has been drafted by ' + captains[draftPickRound - 1] + '!');
        drafted = 0;
        picknum = picknum + 1;
        if (picknum == seasonSize) {
            draftRound = 1;
        } else if (picknum == seasonSize * 2) {
            draftRound = 2;
        } else if (picknum == seasonSize * 3) {
            draftRound = 3;
        } else {
            draftRound = Math.floor(picknum / seasonSize) + 1;
        }
    }

    function updatelinks() { // interface with google sheets to get links
        console.log('updatelinks has been activated!');
        console.log('Retrieving links from the spreadsheet!');

        function random4() {
            ssReadFrom = "'Hall of Fame'!B17:B23";
            authorize(JSON.parse(gappkey), ssread);
        }

        function random6() {
			tournamentName = rows[0];
			tournamentServer = rows[2];
            ssMapLink = rows[4];
            ssMapName = rows[3];
            ssLink = rows[6];
            sgnLink = rows[5];
            seasonNum = rows[1];
            console.log(ssMapName);
            console.log(ssMapLink);
            console.log(seasonNum);
            console.log(ssLink);
            console.log(sgnLink);
        }
        random4();
        setTimeout(random6, 5000);
        setTimeout(backupLinks, 6000);
    }

    function getmail(actor) { // gets mail from arrays
        if (mailUser.indexOf(actor.name.toLowerCase()) > -1) {
            actor.sendMessage("Howdy " + actor.name + "! Let me go get your mail!");
            randomvar = 1;
            while (mailUser.indexOf(actor.name.toLowerCase()) > -1) {
                var messageGetIndex = mailUser.indexOf(actor.name.toLowerCase());
                actor.sendMessage('Message from: ' + mailSender[messageGetIndex] + ' {' + mailTimestamp[messageGetIndex] + '}');
                actor.sendMessage(mailMessage[messageGetIndex]);
                mailTimestamp.splice(messageGetIndex, 1);
                mailUser.splice(messageGetIndex, 1);
                mailMessage.splice(messageGetIndex, 1);
                mailSender.splice(messageGetIndex, 1);
            }
            actor.sendMessage("That's all of your messages for now! If you want to reply to your mail, message me with the command !mail user message! Have a great day! c:");
            backupMail();
        } else {
            actor.sendMessage("Sorry, you don't have any mail. :c");
        }
    }

    function sendtoslack(cid, message) {
        web.chat.postMessage(cid, message, function(err, res) {
            if (err) {
                console.log('Error:', err);
            } else {
                console.log('Message sent: ', res);
            }
        })
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
	function setTournament(name) {
		activeTournament = name;
		activeScriptId = scriptId[tournamentLabel.indexOf(name)];
		activeSpreadsheetId = spreadsheetId[tournamentLabel.indexOf(name)];
		console.log('Active Tournament set to '+name);
	}
    function getDateTime() {
        return moment().format('YYYY-MM-DD HH:mm:ss Z');;
    }
});
