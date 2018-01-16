var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
var request = require('request');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var script = google.script('v1');
var sheets = google.sheets('v4');
const readFile = require('fs-readfile-promise');
var cats = require('cat-ascii-faces');
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/forms'];
var WebClient = require('@slack/client').WebClient;
var GroupMe = require('groupme');
var API = GroupMe.Stateless;

// CUSTOM SETTINGS FOR THE BOT
var botname = 'TToC_BOT'; // name of the bot, make sure it matches the certificate if you're importing it.
var bot_home = 'Meep is God'; // This is used for the !home command to return the bot to a predefined location.
var botmove = 'TToC'; // This is used to move users when a channel is on lockdown.
var scriptId = 'MR8ANgNM86TUijo7WF5u3bAUVXR8RJHBv'; // This ID corresponds to the TToC scripts
var spreadsheetId = '1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4'; // This ID goes to the TToC Spreadsheet
var help = '<b><br/></b>Here is a list of public commands:<b><br/>!cat</b> - Gives one cat.<br/><b>!cats</b> - Want more cats? How about five?<br/><b>!find</b> <b><span style="color:#aa0000">user </span></b>- If the user is on the Mumble Server, a link will be provided to move to their channel. User is case-insensitive.<br/><b>!greet</b> <b><span style="color:#aa0000">message </span></b>- Sets a greeting for the user that will be sent on connect.<br/><b>!greetcat</b> - ' + botname + ' will greet the user with a cat that will be sent on connect.<br/><b>!getmail</b> - Retrieves your mail.<br/><b>!gg <span style="color:#aa0000">name</span><span style="color:#0000ff"> </span></b>- Returns a group link if a group has been registered through the bot.<br/><b>!group <span style="color:#aa0000">server </span><span style="color:#0000ff">name</span></b> - Gives a TagPro group for the corresponding server. You can optionally set a name so other players can access it via the !gg command.<br/><b>!groupc <span style="color:#aa0000">server </span><span style="color:#0000ff">map</span><span style="color:#aa0000"> </span><span style="color:#0000ff">name </span></b>- Gives a competitive group for the corresponding server and map. You can optionally set a name so other players can access it via the !gg command.<br/><b>!groupt <span style="color:#0000ff">name </span></b>- Gives a competitive group for the tournament. You can optionally set a name so other players can access it via the !gg command.<br/><b>!help</b> - Gives user the help message<br/><b>!info</b> - Gives user info about me <br/><b>!mail<span style="color:#aa0000"> user </span><span style="color:#0000ff">message</span></b> - Stores a message for another user to get. They will receive it the next time they enter the server or when they use the !getmail command. The message should just be plain text.<br/><b>!map</b> - Gives user the map for the current season<br/><b>!mods</b> - Gives the list of mods connected to the server.<br/><b>!motd</b> - Gives the current motd of the bot.<br/><b>!qak</b> - qak<br/><b>!signups</b> - Gives user the signup link<br/><b>!spreadsheet</b> - Gives user the spreadsheet link<br/><b>!stop</b> - Adds user to the greylist, which stops the bot from sending automated messages. If done again, user is removed, which lets ' + botname + ' send messages again.<br/><b>!time</b> - Gives user the time of the draft';
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:'; // displayed on error for command
var sadbot = "<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)"; // message to display after automated messages.
var mumbleurl = 'mumble.koalabeast.com'; // url of the mumble server
var bot_info = 'TToC, or the TagPro Tournament of Champions is a regular tournament hosted on the NA TagPro Mumble Server. Signups are usually released at 9:30 PM CST, with the draft starting at around 10:15 PM CST. I am a bot designed to run seasons of TToC. If you have any further questions, feel free to message Poeticalto on the Mumble server or /u/Poeticalto on Reddit.'
var bot_comment = help; // comment of the bot on the mumble server.

// Location for the token used to verify Google oAuth. This was taken from the nodejs quickstart, so if you have the token saved elsewhere, change the DIR/PATH.
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'script-nodejs-quickstart.json';

// The following are defaults for the various functions of the bot.
var mailuser = [];
var mailsender = [];
var mailmessage = [];
var rows;
var seasonnum;
var ssmap;
var ssmaplink;
var sgnlink;
var sslink;
var whitelist = ['Poeticalto', 'Poeticaltwo'];
var blacklist = [];
var greylist = [];
var mods = [];
var welcomeuser;
var welcomemessage;
var slackauth = false;
var slackchannel = undefined;
var slacktoken = undefined;
var groupmeauth = false;
var ACCESS_TOKEN = undefined;
var GROUP_ID = undefined;
var USER_NAME = undefined;
var GMBOT = undefined;
var USER_ID = undefined;
var bot_id = null;
var gauth = false;
var gappkey;
var splitParts;

// for each file, replaces the defaults if it exists.
// consult the readme for help on how to setup each .txt file.

if (fs.existsSync('mailuser.txt')) {
    mailuser = fs.readFileSync('mailuser.txt').toString().split("\n"); //mailuser contains receivers of mail
    console.log('mailuser imported from mailuser.txt!');
} else {
    fs.openSync('mailuser.txt', 'w');
    console.log('mailuser.txt was created!');
}

if (fs.existsSync('mailsender.txt')) {
    mailsender = fs.readFileSync('mailsender.txt').toString().split("\n"); //mailsender contains senders of mail
    console.log('mailsender imported from mailsender.txt!');
} else {
    fs.openSync('mailsender.txt', 'w');
    console.log('mailsender.txt was created!');
}

if (fs.existsSync('mailmessage.txt')) {
    mailmessage = fs.readFileSync('mailmessage.txt').toString().split("\n"); //mailmessage contains mail to send
    console.log('mailmessage imported from mailmessage.txt!');
} else {
    fs.openSync('mailmessage.txt', 'w');
    console.log('mailmessage.txt was created!');
}

if (fs.existsSync('sslink.txt')) {
    rows = fs.readFileSync('sslink.txt').toString().split("\n");
    seasonnum = rows[1]; // seasonnum refers to the season # of the tourney
    ssmap = rows[3]; // ssmap is the map name for the tourney
    ssmaplink = rows[4]; // ssmaplink is the link for the map
    sgnlink = rows[5]; // sgnlink is the signup link for the tourney
    sslink = rows[6]; // sslink is the spreadsheet link for the tourney
    console.log('Spreadsheet info imported from sslink.txt!');
} else {
    fs.openSync('sslink.txt', 'w');
    console.log('sslink.txt was created!');
}

if (fs.existsSync('usergroups.txt')) {
    splitParts = fs.readFileSync('usergroups.txt').toString().split("\n");
    whitelist = splitParts[0].split(" ");
    mods = splitParts[1].split(" ");
    pseudoMods = splitParts[2].split(" ");
    greylist = splitParts[3].split(" ");
    blacklist = splitParts[4].split(" "); // custom groups can be added after this line.
} else {
    fs.openSync('usergroups.txt', 'w');
    console.log('usergroups.txt was created!');
}

if (fs.existsSync('welcomeuser.txt')) {
    welcomeuser = fs.readFileSync('welcomeuser.txt').toString().split("\n"); // welcomeuser is the list of users who want welcome messages
    console.log('welcomeuser imported from welcomeuser.txt!');
} else {
    fs.openSync('welcomeuser.txt', 'w');
    console.log('welcomeuser.txt was created!');
}

if (fs.existsSync('welcomemessage.txt')) {
    welcomemessage = fs.readFileSync('welcomemessage.txt').toString().split("\n"); // welcomemessage is the message corresponding to the users who want welcomes
    console.log('welcomemessage imported from welcomemessage.txt!');
} else {
    fs.openSync('welcomemessage.txt', 'w');
    console.log('welcomemessage.txt was created!');
}

if (fs.existsSync('slacktoken.txt')) {
    slacktoken = fs.readFileSync('slacktoken.txt').toString().split("\n");
    slackchannel = slacktoken[1]; // slackchannel is the channel to send notifs to on slack
    slacktoken = slacktoken[0]; // slacktoken is the API key to talk to slack
    slackauth = true;
    console.log('Slack keys imported from slacktoken.txt!');
}

if (fs.existsSync('groupmekey.txt')) {
    ACCESS_TOKEN = fs.readFileSync('groupmekey.txt').toString().split("\n");
    GROUP_ID = ACCESS_TOKEN[4]; // GROUP_ID is the group id to send groupme messages to
    USER_NAME = ACCESS_TOKEN[3]; // USER_NAME is your groupme name in the group, used to filter out messages
    GMBOT = ACCESS_TOKEN[2]; // GMBOT is the name of your groupme bot
    USER_ID = ACCESS_TOKEN[1]; // USER_ID is your user id [not the bot id]
    ACCESS_TOKEN = ACCESS_TOKEN[0]; // ACCESS_TOKEN is your groupme access token
    groupmeauth = true;
    console.log('GroupMe keys imported from groupmekey.txt!');
}
// Defines the certificates to connect to the mumble server through node-mumble
var options = {
    key: fs.readFileSync('botkey.pem'),
    cert: fs.readFileSync('botcerts.pem')
}

// The following section is the GApps authorization stuff needed to create OAuth keys
// It is taken from the quickstart for node.js, so check that out if you need help with it.
// https://developers.google.com/apps-script/guides/rest/quickstart/nodejs
// Load client secrets from a local file.
if (fs.existsSync('client_secret.json')) {
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err);
            return;
        }
        // sets the client secret to a variable to be used when running Gapp stuff.
        gappkey = content;
        gauth = true;
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
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code != 'EEXIST') {
            throw err;
        }
    }
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
            function: scriptname
        },
        scriptId: scriptId
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
    var sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: spreadsheetId,
        range: ssreadfrom,
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        console.log(ssreadfrom);
        var testarr = response.values;
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
        spreadsheetId: spreadsheetId,
        range: ssreadfrom,
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
var draftstart = 0;
var draftsetup = 0;
var setupstart = 0;
var players = [];
var playersr = [];
var captains = [];
var captainspick = [0];
var picknum = 1;
var setupdraft = 0;
var wait = 0;
var reply = '';
var tree = '';
var seasonsize;
var seasonnum;
var draftmod;
var playerdindex;
var draftround = 1;
var greylist;
var signupsopen = false;
var motdset = false;
var groupbuild;
var groupsend;
var groupid;
var ggid = [];
var gglink = [];
var ggadd;
var motd = "Sorry, there's no motd set right now!";
var lockchannel = [];
var lockschannel = [];
var scriptname;
var ssreadrange;
var ssreadfrom;
var values = [];
var picknumround;
var picknumrounddraft;
var modsmum = [];
var sessions = [];
var sessionsu = [];
var startchat = false;
var contentPieces;

const rl = readline.createInterface({ // creates cmd interface to interact with the bot
    input: process.stdin,
    output: process.stdout
});

// connect to the mumble server
console.log('Connecting to Mumble Server');
console.log('Connecting');

mumble.connect(mumbleurl, options, function(error, connection) {
    if (error) { throw new Error(error); }

    connection.authenticate(botname);
    connection.on('initialized', function() {
        console.log('connection ready');
        connection.user.setSelfDeaf(true); // mute/deafens the bot
        connection.user.setComment(bot_comment); // sets the comment for the bot
    });

    // Initialize slack/groupme connections
    if (slackauth == true) {
        var web = new WebClient(slacktoken);
    } else {
        console.log('Slack token was not imported, you will not be able to use Slack functionality at this time. :c');
        var web;
    }

    if (groupmeauth == true) {
        var incoming = new GroupMe.IncomingStream(ACCESS_TOKEN, USER_ID, null);
    } else {
        console.log('GroupMe auth was not imported, you will not be able to use GroupMe functionality at this time. :c');
        var incoming = rl;
    }

    incoming.on('connected', function() { // gets remaining info needed for bot to run.
        console.log("[IncomingStream 'connected']");

        API.Bots.index(ACCESS_TOKEN, function(err, ret) {
            if (!err) {
                var botdeets;
                for (var i = 0; i < ret.length; i++) {
                    if (ret[i].name == GMBOT) {
                        bot_id = ret[i].bot_id;
                    }
                }
                console.log("[API.Bots.index return] Firing up bot!", bot_id);
            }
        });
    });

    incoming.on('disconnected', function() { // if disconnected from GroupMe API, attempts to reconnect.
        console.log("[IncomingStream 'disconnect']");
        var retryCount = 3;
        if (retryCount > 0 && startchat == true) { // if startchat is false, groupme functionality is disabled, so no reconnect attempts should be made.
            retryCount = retryCount - 1;
            incoming.connect();
        }
    })

    incoming.on('message', function(msg) {
        if (msg["data"] &&
            msg["data"]["subject"] &&
            msg["data"]["subject"]["text"]) { // error is thrown when attempting to access a message without data,subject, or text, so checks to make sure they all exist
            if (bot_id && msg["data"]["subject"]["name"] != USER_NAME && msg["data"]["subject"]["group_id"] == GROUP_ID) {
                connection.user.channel.sendMessage(msg["data"]["subject"]["text"]);
            }
        }
    });

    connection.on('userRemove', function(data) {
        if (data.actor != null && data.ban == false) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' kicked ' + sessionsu[sessions.indexOf(data.session)] + ': ' + data.reason;
            if (slackauth == true) {
                sendtoslack(slackchannel, reply);
            }
        } else if (data.actor != null && data.ban == true) {
            reply = '[NA Mumble] ' + connection.userBySession(data.actor).name + ' banned ' + sessionsu[sessions.indexOf(data.session)] + ': ' + data.reason;
            if (slackauth == true) {
                sendtoslack(slackchannel, reply);
            }
        }
    })

    var users = [];
    var usersf = [];
    var usersl = [];
    connection.on('userState', function(state) {
        if (sessions.indexOf(state.session) > -1) {
            sessionsu[sessions.indexOf(state.session)] = state.name;
        } else {
            sessions.push(state.session);
            sessionsu.push(state.name);
        }
        if (users.indexOf(state.name) == -1 && greylist.indexOf(state.name) == -1) {
            users.push(state.name);
            if (mods.indexOf(state.name) > -1 && modsmum.indexOf(state.name) == -1) {
                if (state.name == 'Cyanide') {
                    modsmum.push('Cryanide');
                } else {
                    modsmum.push(state.name);
                }
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
        if (modsmum.indexOf(state.name) > -1) {
            modsmum.splice(modsmum.indexOf(state.name), 1);
        }
        if (state.name == 'Cyanide') {
            modsmum.splice(modsmum.indexOf('Cryanide'), 1);
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
        if (whitelist.indexOf(actor.name) > -1 && status == true) {
            if (user.name == botname && user.channel.name != actor.channel.name) { // moves bot to the channel of the actor 
                user.moveToChannel(actor.channel);
                actor.channel.sendMessage(actor.name + ' has summoned me to this channel!');
            } else if (user.name == botname && user.channel.name == actor.channel.name) { // if bot is in the same channel as the actor, sends bot to home channel
                user.moveToChannel(connection.channelByName(bot_home));
                actor.channel.sendMessage(actor.name + ' has sent me back home!');
            } else { // moves player to the channel of the bot
                user.moveToChannel(connection.user.channel);
                connection.user.channel.sendMessage(actor.name + ' has moved ' + user.name + ' to ' + connection.user.channel.name + '!');
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
        const isChat = content[0] === '@';
        contentPieces = content.slice(1, content.length).split(' ');
        const command = contentPieces[0].slice(0, contentPieces[0].length).split("<br")[0].split("<p")[0];
        var playerd = contentPieces[1];
        if (contentPieces.length > 2) {
            for (i = 2; i <= contentPieces.length - 1; i++) {
                playerd = playerd + ' ' + contentPieces[i];
            }
        } // arg playerd may have multiple words, so combine everything afters command into one var
        console.log(message);
        if (privateMessage == false && isChat == true && startchat == true) {
            var playerd = contentPieces[0];
            if (contentPieces.length > 1) {
                for (i = 1; i <= contentPieces.length - 1; i++) {
                    playerd = playerd + ' ' + contentPieces[i];
                }
            }
            if (playerd == undefined) {
                connection.user.channel.sendMessage("Sorry, there was nothing to respond to!");
            } else if (groupmeauth == true) {
                playerd = '@zo ' + playerd;

                function hi() {
                    console.log("Success!");
                }
                API.Messages.create(ACCESS_TOKEN, GROUP_ID, {
                    message: {
                        text: playerd,
                        attachments: [{
                            type: "mentions",
                            user_ids: [46185459],
                            loci: [
                                [0, 3]
                            ]
                        }]
                    }
                }, hi);
            }
            console.log(playerd);
        }
        if (isCommand && privateMessage) {
            switch (command) {
                case 'backup': // this case is uneeded since function backup runs after each write/splice, but is kept as a redundant measure.
                    if (whitelist.indexOf(actor.name) > -1) {
                        backup();
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
                        backup();
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
                        if (groupmeauth == true) {
                            if (startchat == false) {
                                startchat = true;
                                connection.user.channel.sendMessage("<br/>Chat mode has been enabled! To chat with the bot, preface your chat with the @ symbol like this @hi bot!");
                                incoming.disconnect();
                                incoming.connect();
                            } else {
                                startchat = false;
                                connection.user.channel.sendMessage("<br/>Chat mode has been disabled! :c");
                                incoming.disconnect();
                            }
                        } else {
                            connection.user.channel.sendMessage("GroupMe functionality has not been enabled! Chat mode is not activated. :c");
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'draft': // draftstart=1 when draft is active, playerd defines the player to draft in the tournament.
                    if (draftstart == 0) {
                        reply = tohelp;
                    } else if (actor.channel.name != connection.user.channel.name) { // to prevent spam, captain must be in the same channel as the bot to draft
                        reply = 'You are not a captain, please do not use this command.';
                    } else if (playersr.length !== 0 && draftstart == 1 && drafted == 1) {
                        reply = 'A pick is currently being processed, please wait...';
                    } else if (playersr.length !== 0 && draftstart == 1 && drafted == 0) {
                        playerdindex = playersr.indexOf(playerd);
                        if (playerdindex > -1) {
                            playersr.splice(playerdindex, 1);
                            drafted = 1;
                            draftplayer(playerd);
                        }
                        /*else if (isNumber(playerd) == true && playerd > 0 && playerd < 120) {
					var playerdi = playerd;
					if (players.length <= playerdi-draftmod){
						playerd = players[playerdi-draftmod];
						playerdindex = playersr.indexOf(playerd);
						if (playerdindex > -1) {
							reply = 'Drafted ' + playerd;
							playersr.splice(playerdindex,1); 
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
                        if (playerd == 'Cryanide') {
                            playerd = 'Cyanide';
                        }
                        if (usersl.indexOf(playerd.toLowerCase()) > -1) {
                            playerd = usersf[usersl.indexOf(playerd.toLowerCase())];
                        }
                        if (connection.userByName(playerd) == undefined) {
                            if (playerd == 'Cyanide') {
                                playerd = 'Cryanide';
                            }
                            reply = 'Sorry, ' + playerd + ' could not be found.';
                        } else {
                            var parentc = [];
                            parentc.unshift(connection.userByName(playerd).channel.name);
                            parentc.unshift(connection.userByName(playerd).channel.parent.name);
                            while (connection.channelByName(parentc[0]).parent.name != 'North American TagPro Mumble') {
                                parentc.unshift(connection.channelByName(parentc[0]).parent.name);
                            }
                            var mumbleurl = 'mumble://mumble.koalabeast.com';
                            for (i = 0; i < parentc.length; i++) {
                                mumbleurl = mumbleurl + '/' + parentc[i].replace(/ /g, "%20");
                            }
                            if (playerd == 'Cyanide') {
                                playerd = 'Cryanide';
                            }
                            reply = '<br/>' + playerd + ' was found in <a href="' + mumbleurl + '"><span style="color:#39a5dd">' + parentc[parentc.length - 1] + '</span></a>';
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
                    } else if (ggid.indexOf(playerd.toLowerCase()) > -1) {
                        reply = '<br/>Here is the ' + playerd.toLowerCase() + ' group:<br/><br/><a href="' + gglink[ggid.indexOf(playerd.toLowerCase())] + '"><span style="color:#39a5dd">' + gglink[ggid.indexOf(playerd.toLowerCase())] + '</span></a>'
                    } else {
                        reply = 'Sorry, a group with that name could not be found. :c';
                    }
                    break;
                    /*case 'ggadd': // ggadd allows actors to add their own group to the bot, allowing others to retrieve it with the !gg command
					if (contentPieces.length >2){
						ggadd = contentPieces[2];
						}
					else {
						ggadd = false;
						}
					if (contentPieces.length > 3){
						for (i=3; i <= contentPieces.length-1;i++) {		
							ggadd = ggadd + ' '+contentPieces[i];
							}}
					playerd = contentPieces[1].toLowerCase();
					if (ggadd == false){
						reply = "Sorry, a name was not specified to save under. Please try again.";
						}
					else {
						if (ggid.indexOf(ggadd) > -1){
							gglink[ggid.indexOf(ggadd)] = groupsend+groupid;
							}
						else {
							ggid.push(ggadd);
							gglink.push(groupsend+groupid);
							}}
					break;*/ //commented out until I figure out if it should be added or not.
                case 'greet': // defines a greeting for the actor which is sent on every connection to the server, playerd defines the message.
                    if (playerd == undefined) {
                        reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';
                    } else {
                        if (welcomeuser.indexOf(actor.name) > -1) {
                            welcomemessage[welcomeuser.indexOf(actor.name)] = playerd;
                        } else {
                            welcomeuser.push(actor.name);
                            welcomemessage.push(playerd);
                        }
                        backup();
                        reply = 'Your greeting has been set! ' + botname + ' will send you this message each time you connect to the server! c:';
                    }
                    break;
                case 'greetcat': // sets the greeting for the actor to a cat which is sent on every connection to the server, playerd is uneeded in this context.
                    if (welcomeuser.indexOf(actor.name) > -1) {
                        welcomemessage[welcomeuser.indexOf(actor.name)] = 'this_is_supposed_to_be_a_cat-217253';
                    } else {
                        welcomeuser.push(actor.name);
                        welcomemessage.push('this_is_supposed_to_be_a_cat-217253');
                    }
                    backup();
                    reply = botname + ' will give you a cat each time you connect to the server! c:';
                    break;
                case 'group': // creates group on a defined server. playerd is the server, ggadd is the optional group name which is stored on the bot.
                    if (contentPieces.length > 2) { // !group server name
                        ggadd = contentPieces[2];
                    } else {
                        ggadd = false;
                    }
                    if (contentPieces.length > 3) {
                        for (i = 3; i <= contentPieces.length - 1; i++) {
                            ggadd = ggadd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = contentPieces[1];
                    if (playerd == undefined) {
                        playerd = 'sphere';
                    } else {
                        playerd = playerd.toLowerCase();
                    }
                    createTagProGroup(playerd, ggadd, actor, false, "r");
                    break;
                case 'groupc': // creates comp group
                    if (contentPieces.length > 3) { // !groupc server map name
                        ggadd = contentPieces[3];
                    } else {
                        ggadd = false;
                    }
                    if (contentPieces.length > 4) {
                        for (i = 4; i <= contentPieces.length - 1; i++) {
                            ggadd = ggadd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = contentPieces[1];
                    if (playerd == undefined) {
                        playerd = 'sphere';
                    } else {
                        playerd = playerd.toLowerCase();
                    }
                    createTagProGroup(playerd, ggadd, actor, true, contentPieces[2].toLowerCase());
                    break;
                case 'groupt': // creates comp group for the tourney
                    if (contentPieces.length > 1) {
                        ggadd = contentPieces[1];
                    } else {
                        ggadd = false;
                    }
                    if (contentPieces.length > 2) {
                        for (i = 2; i <= contentPieces.length - 1; i++) {
                            ggadd = ggadd + ' ' + contentPieces[i];
                        }
                    }
                    playerd = 'sphere';
                    createTagProGroup(playerd, ggadd, actor, true, ssmap.replace(' ', '_').toLowerCase());
                    break;
                case 'help': // sends help info to the actor.
                    reply = help;
                    break;
                case 'here': // moves the bot to the channel of the actor.
                    if (whitelist.indexOf(actor.name) > -1) {
                        connection.user.moveToChannel(actor.channel);
                        actor.channel.sendMessage(actor.name + ' has summoned me to this channel!');
                    } else {
                        actor.sendMessage(tohelp);
                    }
                    break;
                case 'home': // moves the bot back to a predefined home channel.
                    if (whitelist.indexOf(actor.name) > -1) {
                        connection.user.moveToChannel(bot_home);
                        connection.channelByName(bot_home).sendMessage(actor.name + ' has sent me to this channel!');
                    } else {
                        actor.sendMessage(tohelp);
                    }
                    break;
                case 'info': // displays info about the bot
                    reply = bot_info;
                    break;
                case 'locklist':
                    reply = "Here are the channels currently on lockdown!";
                    break;
                case 'lock': // prevents users from entering the channel [note move to does not work if the bot does not have permissions to move]
                    if (whitelist.indexOf(actor.name) > -1 || mods.indexOf(actor.name) > -1 || pseudoMods.indexOf(actor.name) > -1) {
                        if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has put this channel on lockdown! No new users will be allowed unless moved by a whitelisted user.');
                            console.log(actor.channel.name + ' has been put on lockdown');
                            lockchannel.push(actor.channel.name);
                        } else if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has downgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
                            lockchannel.push(actor.channel.name);
                            console.log(actor.channel.name + ' has been downgraded to lockdown');
                            lockschannel.splice(lockschannel.indexOf(actor.channel.name), 1);
                        } else if (lockchannel.indexOf(actor.channel.name) > -1 || lockschannel.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has lifted the channel lockdown! Users may now freely enter and leave.');
                            lockchannel.splice(lockchannel.indexOf(actor.channel.name), 1);
                            lockschannel.splice(lockschannel.indexOf(actor.channel.name), 1);
                            console.log(actor.channel.name + ' has been removed from lockdown');
                        }
                    } else {
                        actor.sendMessage(tohelp);
                    }
                    break;
                case 'lock+': // prevents users from entering or leaving the channel [note, move back does not work if bot does not have permissions to move]
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has put this channel on super lockdown! No new users will be allowed to enter or leave unless moved by a whitelisted user.');
                            lockschannel.push(actor.channel.name);
                            console.log(actor.channel.name + ' has been put on lockdown+');
                        } else if (lockchannel.indexOf(actor.channel.name) > -1 && lockschannel.indexOf(actor.channel.name) == -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has upgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
                            console.log(actor.channel.name + ' has been upgraded to lockdown+');
                            lockschannel.push(actor.channel.name);
                            lockchannel.splice(lockschannel.indexOf(actor.channel.name), 1);
                        } else if (lockchannel.indexOf(actor.channel.name) > -1 || lockschannel.indexOf(actor.channel.name) > -1) {
                            connection.channelByName(actor.channel.name).sendMessage(actor.name + ' has lifted the channel lockdown! Users may now freely enter and leave.');
                            console.log(actor.channel.name + ' has been removed from lockdown+');
                            lockchannel.splice(lockchannel.indexOf(actor.channel.name), 1);
                            lockschannel.splice(lockschannel.indexOf(actor.channel.name), 1);
                        }
                    } else {
                        actor.sendMessage(tohelp);
                    }
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
                        var mailusertemp = contentPieces[1];
                        var mailmestemp = contentPieces[2];
                        for (i = 3; i <= contentPieces.length - 1; i++) {
                            mailmestemp = mailmestemp + ' ' + contentPieces[i];
                        }
                        mailuser.push(mailusertemp.toLowerCase());
                        mailsender.push(actor.name);
                        mailmessage.push(mailmestemp);
                        reply = 'Your mail has been successfully created! Your receiver will receive it when they enter the server or use the !getmail command! c:';
                        backup();
                    } else if (playerd == undefined) {
                        reply = 'A mail message was not detected! Please add a message in the form !mail user command [Ex. !mail Cryanide hi]';
                    } else {
                        reply = "You don't have permission to do that! :c";
                    }
                    break;
                case 'map': // sends the map link for the tournament
                    if (setupstart == 1) {
                        reply = '<br/>The map for tonight is: <a href="' + ssmaplink + '"><b><i><span style="color:#00557f">' + ssmap + '</span></i></b></a>';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'mods':
                    reply = '<br/> Here are the mods currently on: <br/>' + modsmum + '<br/>To find any of these mods, use the !find command! c:';
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
                case 'reset': // Incomplete, resets the bot
                    reply = 'brb!';
                    break;
                case 'setgreet': // allows a whitelisted actor to set a greeting for a specific user
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (contentPieces.length > 2) {
                            ggadd = contentPieces[2];
                        } else {
                            ggadd = false;
                        }
                        if (contentPieces.length > 3) {
                            for (i = 3; i <= contentPieces.length - 1; i++) {
                                ggadd = ggadd + ' ' + contentPieces[i];
                            }
                        }
                        playerd = contentPieces[1];
                        if (playerd == undefined) {
                            reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';
                        } else {
                            if (welcomeuser.indexOf(playerd) > -1) {
                                welcomemessage[welcomeuser.indexOf(playerd)] = ggadd;
                            } else {
                                welcomeuser.push(playerd);
                                welcomemessage.push(ggadd);
                            }
                            backup();
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
                            if (welcomeuser.indexOf(playerd) > -1) {
                                welcomemessage[welcomeuser.indexOf(playerd)] = 'this_is_supposed_to_be_a_cat-217253';
                            } else {
                                welcomeuser.push(playerd);
                                welcomemessage.push('this_is_supposed_to_be_a_cat-217253');
                            }
                            backup();
                            reply = 'Greeting has been set for ' + playerd + '! They will receive a cat each time they connect. c:';
                        }
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'setupdraft': // sets up the draft, playerd is uneeded.
                    if (whitelist.indexOf(actor.name) > -1 && gauth == true) {
                        setupdraft = 1;
                        reply = 'Setting up draft now!';
                        draftsetup();
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'setupsheet': // sets up the form and sheet, playerd is uneeded.
                    if (whitelist.indexOf(actor.name) > -1 && gauth == true) {
                        setupstart = 1;
                        reply = 'Setting up sheet now!';
                        sheetsetup();
                        signupsopen = true;
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'signups': // replies with the signup link, playerd is uneeded.
                    if (setupstart == 1) {
                        reply = '<a href="' + sgnlink + '"><b><span style="color:#aa0000"><br/>Click here for the signups!</span></b></a>';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'spreadsheet': // replies with the spreadsheet link, playerd is uneeded.
                    if (setupstart == 1) {
                        reply = '<br/><a href="' + sslink + '"><b><span style="color:#00007f">Click here for the spreadsheet!</span></b></a>';
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
                        backup();
                        reply = "You've been added to the greylist! You will no longer receive automated messages from TToC_BOT when you connect.";
                    } else {
                        greylist.splice(greylist.indexOf(actor.name), 1);
                        backup();
                        reply = "You've been removed from the greylist! You will now receive automated message from " + botname + " when you connect.";
                    }
                    break;
                case 'stream': // test case right now, but allows for treeing the motd, playerd is uneeded.
                    for (i = 0; i < users.length; i++) {
                        //connection.userByName(users[i]).sendMessage('this is a quick test of the '+botname+' tree function, please ignore c:');
                        console.log(users[i]);
                    }
                    break;
                case 'time': // shows the time
                    if (setupstart == 1) {
                        reply = 'TToC was treed at 9:30 PM CST and the draft will start at around 10:15 PM CST.';
                    } else {
                        reply = 'Signups have not been released yet, check back in a bit! c:';
                    }
                    break;
                case 'trade': // trades two captains based on their position on the draft board. Requires two numbers for each trading party.
                    if (whitelist.indexOf(actor.name) > -1 && gauth == true) {
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
                        ssreadfrom = "'S-" + seasonnum + "'!N6:N" + playerd;
                        for (i = 0; i < 6; i++) {
                            values.push([captains[i]]);
                        }

                        function random8() {
                            authorize(JSON.parse(gappkey), sswrite);
                        }
                        random8();
                        connection.user.channel.sendMessage('Successfully switched captains ' + tradec1 + ' and ' + tradec2 + '!');
                        connection.channelByName('Spectating Lounge [Open to all]').sendMessage('Successfully switched captains ' + tradec1 + ' and ' + tradec2 + '!');
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
                    if (whitelist.indexOf(actor.name) > -1 && gauth == true) {
                        console.log('updating links!');
                        reply = 'Updating links!';
                        updatelinks();
                        setupstart = 1;
                        signupsopen = true;
                    } else {
                        reply = tohelp;
                    }
                    break;
                case 'updatemotd': // updates var motd to a line on motd.txt, playerd defines which number to utilize, defaults to 0
                    if (whitelist.indexOf(actor.name) > -1) {
                        if (motdset == false) {
                            motdset = true;
                            playerd = parseInt(contentPieces[1]);
                            motd = fs.readFileSync('motd.txt').toString().split("\n");
                            console.log(playerd);
                            console.log(Number.isInteger(playerd));
                            console.log(motd.length);
                            if (Number.isInteger(playerd) == true && playerd <= motd.length - 1 && playerd >= 0) {
                                motd = motd[playerd];
                            } else {
                                motd = motd[0];
                            }
                            motd = motd + sadbot;
                            reply = 'motd has been updated and turned on!';
                        } else {
                            motdset = false;
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
                        backup();
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
                actor.sendMessage(reply);
            }
        }
    });

    connection.on('error', function(MumbleError) { //incomplete, error event when something goes wrong through mumble, need to add parsing of error
        console.log(MumbleError.name);
    })

    connection.on('user-connect', function(user) { // user-connect is the event emitted when a user connects to the server
        if (mailuser.indexOf(user.name.toLowerCase()) > -1) { // sends mail if user has mail to collect.
            user.sendMessage("Howdy " + user.name + "! I've been keeping some cool mail from other people for you, let me go get it!");
            getmail(user);
        }
        if (signupsopen == true && greylist.indexOf(user.name) == -1) { // if a tournament is running, signups are sent to the player
            user.sendMessage("<br/>TToC signups are currently open for " + ssmap + "! If you want to signup, message me !signups or !spreadsheet<br/><br/>(If you don't want these automated messages, message the !stop command to me)");
        } else if (greylist.indexOf(user.name) == -1 && signupsopen == false && motdset == true) { // sends the motd if active
            user.sendMessage(motd);
        } else if (welcomeuser.indexOf(user.name) > -1 && signupsopen == false && motdset == false) { // sends the user's predefined welcome message
            if (welcomemessage[welcomeuser.indexOf(user.name)] == 'this_is_supposed_to_be_a_cat-217253') {
                user.sendMessage("<br/>" + botname + " sends a cat to say hi!<br/><br/>" + cats() + "<br/>");
            } else {
                user.sendMessage(welcomemessage[welcomeuser.indexOf(user.name)]);
            }
        } else if (greylist.indexOf(user.name) == -1 && signupsopen == false && motdset == false) { // default message sent to every player on connect.
            //user.sendMessage("<br/>"+botname+" sends a cat to say hi!<br/><br/>"+cats()+"<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)");
        }
    });

    connection.on('user-move', function(user, fromChannel, toChannel, actor) { // user-move is the event emitted when a user switches channels
        if ((lockchannel.indexOf(toChannel.name) > -1 || lockschannel.indexOf(toChannel.name) > -1) && actor.name != botname && (whitelist.indexOf(actor.name) == -1 || mods.indexOf(actor.name) == -1 || pseudoMods.indexOf(actor.name) == -1)) { // prevents user from entering if channel is locked.
            user.moveToChannel(botmove);
            user.sendMessage('Sorry, you cannot enter this channel right now. :c');
            connection.channelByName(toChannel.name).sendMessage(user.name + ' was prevented from entering this channel!');
        } else if (lockschannel.indexOf(fromChannel.name) > -1 && actor.name != botname && (whitelist.indexOf(actor.name) == -1 || mods.indexOf(actor.name) == -1 || pseudoMods.indexOf(actor.name) == -1)) { // prevents user from leaving is channel is on super lockdown.
            user.moveToChannel(fromChannel.name);
            user.sendMessage('Sorry, you cannot leave this channel right now. :c');
            connection.channelByName(fromChannel.name).sendMessage(user.name + ' was prevented from leaving this channel!');
        } else if (connection.user.channel.name == toChannel.name && user.name != botname && actor.name != botname) { // if user has mail, sends a message to remind them to collect it.
            connection.user.channel.sendMessage('Welcome to ' + toChannel.name + ' ' + user.name + '!');
        }
        if (mailuser.indexOf(user.name.toLowerCase()) > -1) {
            user.sendMessage("This is an automated reminder from " + botname + " that you have some mail! Message !getmail to me when you're ready to receive it! c:");
        }
        if (toChannel.name == 'In-Game Moderators Assistance Room' && mods.indexOf(user.name) == -1) {
            user.sendMessage('<br/>Welcome to the In-Game Moderators Assistance Room! If you want a list of mods currently on Mumble, use the !mods command. <br/><br/>If there is not a mod available, try going to the IRC channel by <a href="http://webchat.freenode.net/?channels=tpmods"><b><span style="color:#39a5dd">clicking here</span></b></a>, where a mod is almost always availble to help there! c:');
            reply = '[NA Mumble] ' + user.name + ' is waiting in the In-Game Moderators Assistance Room!';
            if (slackauth == true) {
                sendtoslack(slackchannel, reply);
            }
        }
    });

    function sheetsetup() { // sets up the form and sheet for a season.
        console.log('setupsheet has been activated!');
        console.log('Running Form Setup Script');

        function random1() {
            scriptname = 'FormSetup';
            authorize(JSON.parse(gappkey), gscriptrun);
        }

        function random2() {
            scriptname = 'SheetSetup';
            authorize(JSON.parse(gappkey), gscriptrun);
        }
        random1();
        setTimeout(random2, 15000);

        updatelinks();
        setTimeout(backup, 5000);
    }

    function draftsetup() { // sets up a draft for a season.
        console.log('setupdraft has been activated!');
        console.log('Running Draft Setup Script');
        scriptname = 'DraftBoardSetup';
        authorize(JSON.parse(gappkey), gscriptrun);

        function random11() {
            ssreadfrom = "'S-" + seasonnum + "'!T3";
            rows = [];
            authorize(JSON.parse(gappkey), ssread);
        }

        function random12() {
            seasonsize = rows[0];
            console.log(seasonsize);
            console.log(rows);
            playerd = parseInt(seasonsize) + 5;
            console.log(seasonsize);
            ssreadfrom = "'S-" + seasonnum + "'!N6:N" + playerd;
            authorize(JSON.parse(gappkey), ssread);
            for (i = 0; i < seasonsize; i++) {
                captains[i] = rows[i];
            }
        }
        setTimeout(random11, 10000);
        setTimeout(random12, 15000);
    }

    function pickrefresh() { // incomplete, if bot crashes during the draft, this is supposed to retrieve needed information
        /* 
	TODO refresh the following vars:
	spreadsheet link
	form link
	tree message
	if draft has started:
	players
	playersr(duplicate of players)
	captains
	season size
*/
    }

    function draftstart() { // concludes trading period and starts draft
        console.log('draftstart has been activated!');
        console.log('Starting Draft!');
        draftround = 1;
        draftstart = 1;
        drafted = 0;
        switch (parseInt(seasonsize)) { // draftmod defines where to start getting signups from.
            case 3:
                draftmod = 7 + 5;
                break;
            case 4:
                draftmod = 13 + 5;
                break;
            case 6:
                draftmod = 16 + 5;
                break;
            case 8:
                draftmod = 20 + 5;
                break;
            case 9:
                draftmod = 20 + 5;
                break;
            case 12:
                draftmod = 23 + 5;
                break;
            case 16:
                draftmod = 30 + 5;
                break;
            case 18:
                draftmod = 32 + 5;
                break;
            case 21:
                draftmod = 35 + 5;
                break;
            case 24:
                draftmod = 38 + 5;
                break;
            default:
                draftmod = -1;
                break;
        }
        playerd = parseInt(draftmod) + 4 * parseInt(seasonsize);
        ssreadfrom = "'S-" + seasonnum + "'!" + "M" + draftmod + ":M" + playerd;
        authorize(JSON.parse(gappkey), ssread);
        players = rows;
        for (i = 0; i < seasonsize; i++) {
            players.splice(players.indexOf(captains[i]), 1);
        }
        playersr = players;
    }

    function backup() { // backs up data.
        console.log('backing up data!');
        rows = ['TToC', seasonnum, 'Sphere', ssmap, ssmaplink, sgnlink, sslink];
        fs.writeFileSync('sslink.txt', rows.join('\n'));
        fs.writeFileSync('mailuser.txt', mailuser.join('\n'));
        fs.writeFileSync('mailmessage.txt', mailmessage.join('\n'));
        fs.writeFileSync('mailsender.txt', mailsender.join('\n'));
        fs.writeFileSync('welcomemessage.txt', welcomemessage.join('\n'));
        fs.writeFileSync('welcomeuser.txt', welcomeuser.join('\n'));
        fs.writeFileSync('usergroups.txt', whitelist.join(' ') + '\n' + mods.join(' ') + '\n' + pseudoMods.join(' ') + '\n' + greylist.join(' ') + '\n' + blacklist.join(' '));
        console.log('data has been backed up!');
    }

    function draftplayer(playerd) { // interface with google sheets to write player name on the draft board
        console.log(playerd + ' is being drafted!');
        seasonnum = 292;
        seasonsize = 6; // tempvars for testing
        picknumround = picknum % seasonsize;
        if (picknumround == 0 && draftround == 1) {
            picknumround = seasonsize;
        } else if (picknumround == 0 && (draftround == 2 || draftround == 3)) {
            picknumround = 1;
        } else if (draftround > 1 && picknumround != seasonsize) {
            picknumround = seasonsize - picknumround + 1;
        }
        if (picknum == seasonsize + 1) {
            picknumround = seasonsize;
        }
        picknumrounddraft = picknumround + 5;
        switch (draftround) {
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
        ssreadfrom = "'S-" + seasonnum + "'!" + picknumcolumn + picknumrounddraft;
        values = [
            [playerd]
        ];

        function random5() {
            authorize(JSON.parse(gappkey), sswrite);
        }
        random5();
        connection.user.channel.sendMessage(playerd + ' has been drafted by ' + captains[picknumround - 1] + '!');
        connection.channelByName('Spectating Lounge [Open to all]').sendMessage(playerd + ' has been drafted by ' + captains[picknumround - 1] + '!');
        drafted = 0;
        picknum = picknum + 1;
        if (picknum == seasonsize) {
            draftround = 1;
        } else if (picknum == seasonsize * 2) {
            draftround = 2;
        } else if (picknum == seasonsize * 3) {
            draftround = 3;
        } else {
            draftround = Math.floor(picknum / seasonsize) + 1;
        }
    }

    function updatelinks() { // interface with google sheets to get links
        console.log('updatelinks has been activated!');
        console.log('Retrieving links from the spreadsheet!');

        function random4() {
            ssreadfrom = "'Hall of Fame'!B17:B23";
            authorize(JSON.parse(gappkey), ssread);
        }

        function random6() {
            ssmaplink = rows[4];
            ssmap = rows[3];
            sslink = rows[6];
            sgnlink = rows[5];
            seasonnum = rows[1];
            console.log(ssmap);
            console.log(ssmaplink);
            console.log(seasonnum);
            console.log(sslink);
            console.log(sgnlink);
        }
        random4();
        setTimeout(random6, 5000);
        setTimeout(backup, 6000);
    }

    function getmail(actor) { // gets mail from arrays
        if (mailuser.indexOf(actor.name.toLowerCase()) > -1) {
            actor.sendMessage("Howdy " + actor.name + "! Let me go get your mail!");
            randomvar = 1;
            while (mailuser.indexOf(actor.name.toLowerCase()) > -1) {
                var messagegeti = mailuser.indexOf(actor.name.toLowerCase());
                actor.sendMessage('Message from: ' + mailsender[messagegeti]);
                actor.sendMessage(mailmessage[messagegeti]);
                mailuser.splice(messagegeti, 1);
                mailmessage.splice(messagegeti, 1);
                mailsender.splice(messagegeti, 1);
            }
            actor.sendMessage("That's all of your messages for now! If you want to reply to your mail, message me with the command !mail user message! Have a great day! c:");
            backup();
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

    function createTagProGroup(playerd, ggadd, actor, toggle, mapname) {
        if (playerd == 'maptest' || playerd == 'maptest2' || playerd == 'maptest3') {
            groupbuild = 'http://' + playerd + '.newcompte.fr/groups/create';
            groupsend = 'http://' + playerd + '.newcompte.fr/groups/';
        } else if (playerd == 'test') {
            groupbuild = 'test';
            groupdsend = 'test';
        } else {
            groupbuild = 'http://tagpro-' + playerd + '.koalabeast.com/groups/create';
            groupsend = 'http://tagpro-' + playerd + '.koalabeast.com/groups/';
        }
        request({
            method: 'POST',
            uri: groupbuild,
            multipart: [{
                'follow_redirects': 'false',
                body: JSON.stringify({ public: "off" })
            }]
        }, function(error, response, body) {
            if (response != null) {
                groupid = body.split("/groups/")[body.split("/groups/").length - 1];
                if (toggle == true) {
                    groupid = groupid + "/#tg-" + mapname;
                }
                console.log(groupsend + groupid);
                reply = '<br/>Here is your ' + playerd + ' group:<br/><br/><a href="' + groupsend + groupid + '"><span style="color:#39a5dd">' + groupsend + groupid + '</span></a>';
            } else {
                reply = '<br/> There was an error when creating your group. Check to make sure you put an actual server! c:';
            }
        })

        function random3() {
            console.log(reply);
            actor.sendMessage(reply);
            if (ggadd != false && blacklist.indexOf(actor.name) == -1) { // players on the blacklist will be able to make groups but not add them to the public list of groups
                if (ggid.indexOf(ggadd) > -1) {
                    gglink[ggid.indexOf(ggadd)] = groupsend + groupid;
                } else {
                    ggid.push(ggadd.toLowerCase());
                    gglink.push(groupsend + groupid);
                }
            }
        }
        setTimeout(random3, 500);
    }
});