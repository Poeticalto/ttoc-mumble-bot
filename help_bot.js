var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
var request = require('request');
var readline = require('readline');
var cats = require('cat-ascii-faces');
var WebClient = require('@slack/client').WebClient;
const path = require('path');
//var irc = require('irc');

var mumbleUrl = 'mumble.koalabeast.com';
var botName = 'test_BOT';
var botHome = 'Lobby';
var botMoveTo = 'Lobby';
var help = 'I am a bot designed in node.js!';
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:';
var botInfo = "I am a test bot using Poeticalto's help-mumble-bot as a base!";
var greyMessage = "<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)";
var whitelist = ['Poeticalto', 'Poeticaltwo'];
var blacklist = [];
var greylist = [];
var mods = [];

/*
if (fs.existsSync(path.join(__dirname,'/bot_data/','irc_help_info.txt'))) {
    ircChannel = fs.readFileSync(path.join(__dirname,'/bot_data/','irc_help_info.txt')).toString().split("\n");
	ircServer = ircChannel[0];
	ircName = ircChannel[1];
	ircPassword = ircChannel[3];
	ircChannel = ircChannel[2];
    ircAuth = true;
    console.log('IRC server info imported from irc_info.txt!');
}

*/
if (fs.existsSync(path.join(__dirname,'/bot_data/','mumble_help_info.txt'))) {
    rows = fs.readFileSync(path.join(__dirname,'/bot_data/','mumble_help_info.txt')).toString().split("\n");
	mumbleUrl = rows[0];
	botName = rows[1];
	botHome = rows[2];
	botMoveTo = rows[3];
	help = rows[4];
	tohelp = rows[5];
	botInfo = rows[6];
	greyMessage = rows[7];
    console.log('Mumble info imported from mumble_help_info.txt!');
} else {
    fs.openSync(path.join(__dirname,'/bot_data/','mumble_help_info.txt'), 'w');
	fs.writeFileSync(path.join(__dirname,'/bot_data/','mumble_info.txt'),mumbleUrl + '\n' + botName + '\n' + botHome + '\n' + botMoveTo + '\n' + help+ '\n'+ tohelp + '\n' + botInfo + '\n' + greyMessage + '\n');
    console.log('mumble_help_info.txt was created!');
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


if (fs.existsSync(path.join(__dirname,'/keys/','slack_keys.txt'))) {
    slackToken = fs.readFileSync(path.join(__dirname,'/keys/','slack_keys.txt')).toString().split("\n");
    slackChannel = slackToken[1]; // slackChannel is the channel to send notifs to on slack
    slackToken = slackToken[0]; // slackToken is the API key to talk to slack
    slackAuth = true;
    console.log('Slack keys imported from slack_keys.txt!');
}

var options = {
    key: fs.readFileSync(path.join(__dirname,'/keys/','helpkey.pem')),
    cert: fs.readFileSync(path.join(__dirname,'/keys/','helpcert.pem'))
}

var reply = '';
var values = [];
var modsMumbleList = [];
var mumbleSessionNum = [];
var mumbleSessionUsers = [];
var contentPieces;
var ircBridge = [];

const rl = readline.createInterface({ // creates cmd interface to interact with the bot
    input: process.stdin,
    output: process.stdout
});

// connect to the mumble server
console.log('Connecting to Mumble Server');
console.log('Connecting');

mumble.connect(mumbleUrl, options, function(error, connection) {
    if (error) { throw new Error(error); }

    connection.authenticate(botName);
    connection.on('initialized', function() {
        console.log('connection ready');
        connection.user.setSelfDeaf(false); // mute/deafens the bot
        connection.user.setComment(help); // sets the help statement as the comment for the bot
    });
	
	process.on('uncaughtException', function (exception) {
	console.log(exception);
	});
/*	
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
	} else {
		console.log('IRC info was not imported, you will not be able to use IRC functionality at this time. :c');
		var client;
	}
	
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
	*/
    connection.on('userRemove', function(data) {
        if (data.actor != null && data.ban == false) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' kicked ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
            if (slackAuth == true) {
                sendtoslack(slackChannel, reply);
            }
        } else if (data.actor != null && data.ban == true) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' banned ' + mumbleSessionUsers[mumbleSessionNum.indexOf(data.session)] + ': ' + data.reason;
            if (slackAuth == true) {
                sendtoslack(slackChannel, reply);
            }
        }
    })

    var users = [];
    var usersf = [];
    var usersl = [];
	
    connection.on('userState', function(state) {
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
    });

    rl.on('line', (input) => {
            connection.user.channel.sendMessage(input);
        }) //allows user to chat as the bot via command line

    /* var channels = [];
connection.on( 'channelState', function (state) {
if (channels.indexOf(state.channel_id) == -1){
	channels.push(state.channel_id);}
}); */ //used to get a list of channel ids, may be better as a tree function depending on the amount of channels on the server

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
				case 'cat': // sends a cat to the user.
                    reply = cats();
                    break;
                case 'cats': // sends multiple cats to the user.
                    reply = "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats() + "<br/>" + cats();
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
				case 'help': // sends help info to the actor.
                    reply = help;
                    break;
				case 'info': // displays info about the bot
                    reply = botInfo;
                    break;
				case 'mods':
					if (ircBridge.indexOf(actor.name) == -1 && actor.isRegistered() == true){
					ircBridge.push(actor.name);
						if (playerd == undefined){
							client.say('#tpmods',actor.name+' has joined via the NA Mumble Bridge!');
							reply = "<br/>You have been connected to the #tpmods IRC Channel! To communicate, simply PM me with your message and I'll forward it along!<br/>If you want to disconnect from the bridge, simply message !mods or disconnect from Mumble.";
						}
						else {
							client.say('#tpmods',actor.name+' has joined via the NA Mumble Bridge with: '+playerd);
							reply = "<br/>Your message has been sent to the #tpmods IRC Channel! To communicate further, simply PM me with your message and I'll forward it along!<br/>If you want to disconnect from the bridge, simply message !mods or disconnect from Mumble.";
						}
					}
					else if (actor.isRegistered() == false){
						reply = '<br/>Sorry, only registered Mumble users can use the NA Mumble Bridge.<br/>Register yourself by right clicking on your name and clicking register, or <a href="https://goo.gl/3ORahu"><b><span style="color:#39a5dd">click here</span></b></a> to go directly to the IRC channel via your browser!'
					}
					else {
						ircBridge.splice(ircBridge.indexOf(actor.name),1);
						reply = "You have disconnected from the #tpmods IRC Channel! If you need any help from a mod on Mumble, use the !modlist command to find a mod!";
						client.say('#tpmods',actor.name+' has disconnected from the NA Mumble Bridge!');
					}
					break;
                case 'modslist':
                    reply = '<br/> Here are the mods currently on: <br/>' + modsMumbleList + '<br/>To find any of these mods, use the !find command! c:';
                    break;
				case 'reboot':
					if (whitelist.indexOf(actor.name) > -1) {
						process.exit(0);
					}
					else {
						reply = tohelp;
					}
					break;
				case 'send':
					client.say('#tpmods',actor.name+'has sent the following request: '+message);
					reply = 'Your message has been sent! You will receive mail once your request has been processed by the mods.';
					break;
				default:
					reply = tohelp;
					break;
			}
			var noReply = ['move'];
            if (noReply.indexOf(command) == -1 || reply != '') {
                console.log(reply);
                actor.sendMessage(reply);
            }
        }
		else if (privateMessage && ircBridge.indexOf(actor.name) > -1){
			client.say('#tpmods',actor.name+': '+message);
			}
	})
	
	connection.on('error', function(MumbleError) { //incomplete, error event when something goes wrong through mumble, need to add parsing of error
        console.log(MumbleError.name);
		process.exit(0);		
    })
	
	connection.on('user-move', function(user, fromChannel, toChannel, actor) { 
		if (user.name == botName){
			user.moveToChannel(connection.channelByName(botHome));
		}
		if (toChannel.name == 'In-Game Moderators Assistance Room' && mods.indexOf(user.name) == -1) {
            user.sendMessage('<br/>Welcome to the In-Game Moderators Assistance Room! If you want a list of mods currently on Mumble, use the !mods command. <br/><br/>If there is not a mod available, try going to the IRC channel by <a href="http://webchat.freenode.net/?channels=tpmods"><b><span style="color:#39a5dd">clicking here</span></b></a>, where a mod is almost always availble to help there! c:');
            reply = '[NA Mumble] ' + user.name + ' is waiting in the In-Game Moderators Assistance Room!';
            if (slackAuth == true) {
                sendtoslack(slackChannel, reply);
            }
        }	
	})
	
	
})
    
	function sendtoslack(cid, message) {
        web.chat.postMessage(cid, message, function(err, res) {
            if (err) {
                console.log('Error:', err);
            } else {
                console.log('Message sent: ', res);
            }
        })
    }
	