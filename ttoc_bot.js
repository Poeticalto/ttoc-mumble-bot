var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
var request = require('request');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');
var spreadsheetId = '1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4';
//var cool = require('cool-ascii-faces'); //not really needed, but faces are pretty cool
var cats = require('cat-ascii-faces');
// This part is the code used to authenticate with Google API
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/forms'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'script-nodejs-quickstart.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// The following section is the GApps authorization stuff needed to create OAuth keys
// It is taken from the quickstart for node.js, so check that out if you need help with it.

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Apps Script Execution API.
  gappkey = content;
});

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
var scriptId = 'MR8ANgNM86TUijo7WF5u3bAUVXR8RJHBv'; // This ID corresponds to the TToC scripts
var script = google.script('v1');
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
      console.log('The API returned an error: ' + err);// The API encountered a problem before the script started executing.
      return;
    }
    if (resp.error) {
      var error = resp.error.details[0];
      console.log('Script error message: ' + error.errorMessage);
      console.log('Script error stacktrace:');       // The API executed, but the script returned an error.
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

function ssread(auth){
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
    var rows = response.values;
    if (rows.length == 0) {
      console.log('No data found.');
    } else {
      console.log('List of players: ');
      for (var i = 0; i < rows.length; i++) {
		testarr[i] = rows[i][0];
		console.log(rows[i]);
      }
    }
  });
}


/*
var values = [
  [
    // Cell values ...
  ],
  // Additional rows ...
];

*/
function sswrite(auth){
	var body = {
  values: values
};
service.spreadsheets.values.update({
  spreadsheetId: spreadsheetId,
  range: range,
  valueInputOption: valueInputOption,
  resource: body
}, function(err, result) {
  if(err) {
    // Handle error
    console.log(err);
  } else {
    console.log('%d cells updated.', result.updatedCells);
  }
});}
// End of defining google apps scripts



// Define global variables
var drafted = 0;
var draftstart = 0;
var draftsetup = 0;
var setupstart = 0;
var players = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x"]; // letters are stock until I set up the draft stuff 
var playersr = players;
var captains = ["Poeticalto"];
var captainspick = [0];
var picknum = 1;
var newseason = 0;
var setupsheet = 0;
var setupdraft = 0;
var sgnlink;
var sslink;
var ssmap;
var ssmaplink;
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:';
var wait = 0;
var reply = '';
var tree = '';
var seasonsize;
var draftmod;
var playerdindex;
var draftround = 1;
var mumbleurl = 'mumble.koalabeast.com';
var whitelist;
var blacklist;
var greylist;
var captainsmum;
var signupsopen = false;
var mailuser;
var mailsender;
var mailmessage;
var sadbot = "<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)";
var motdset = false;
var groupbuild;
var groupsend;
var groupid;
var ggid = [];
var gglink = [];
var ggadd;
var motd = "Sorry, there's no motd set right now!";
var welcomeuser;
var welcomemessage;
var lockchannel = [];
var lockschannel = [];
var testarr = [];
var scriptname;
var ssreadrange;
var ssreadfrom;
var help = '<b><br/></b>Here is a list of public commands:<b><br/>!cat</b> - Gives one cat.<br/><b>!cats</b> - Want more cats? How about five?<br/><b>!greet</b> <b><span style="color:#aa0000">message </span></b>- Sets a greeting for the user that will be sent on connect.<br/><b>!greetcat</b> - TToC_BOT will greet the user with a cat that will be sent on connect.<br/><b>!getmail</b> - Retrieves your mail.<br/><b>!gg <span style="color:#aa0000">name</span><span style="color:#0000ff"> </span></b>- Returns a group link if a group has been registered through the bot.<br/><b>!group <span style="color:#aa0000">server </span><span style="color:#0000ff">name</span></b> - Gives a TagPro group for the corresponding server. You can optionally set a name so other players can access it via the !gg command.<br/><b>!help</b> - Gives user the help message<br/><b>!info</b> - Gives user info about me <br/><b>!mail<span style="color:#aa0000"> user </span><span style="color:#0000ff">message</span></b> - Stores a message for another user to get. They will receive it the next time they enter the server or when they use the !getmail command. The message should just be plain text.<br/><b>!map</b> - Gives user the map for the current season<br/><b>!motd</b> - Gives the current motd of the bot.<br/><b>!qak</b> - qak<br/><b>!signups</b> - Gives user the signup link<br/><b>!spreadsheet</b> - Gives user the spreadsheet link<br/><b>!stop</b> - Adds user to the greylist, which stops the bot from sending automated messages. If done again, user is removed, which lets TToC_BOT send messages again.<br/><b>!time</b> - Gives user the time of the draft';


// imports information from .txt files in folder
if (fs.existsSync('whitelist.txt')) {
mailuser = fs.readFileSync('mailuser.txt').toString().split("\n");       //mailuser contains receivers of mail
mailsender = fs.readFileSync('mailsender.txt').toString().split("\n");   //mailsender contains senders of mail
mailmessage = fs.readFileSync('mailmessage.txt').toString().split("\n"); //mailmessage contains mail to send
sslink = fs.readFileSync('sslink.txt').toString().split("\n");           //sslink contains the signup link [sgnlink] and spreadsheet link [sslink]
sgnlink = sslink[0];
sslink = sslink[1];
ssmap = fs.readFileSync('ssmap.txt').toString().split("\n");             //ssmap contains the map name [ssmap] and map link [ssmaplink]
ssmaplink = ssmap[1];
ssmap = ssmap[0];
whitelist = fs.readFileSync('whitelist.txt').toString().split("\n");
blacklist = fs.readFileSync('blacklist.txt').toString().split("\n");
greylist = fs.readFileSync('greylist.txt').toString().split("\n");
welcomeuser = fs.readFileSync('welcomeuser.txt').toString().split("\n");
welcomemessage = fs.readFileSync('welcomemessage.txt').toString().split("\n");
}
else { //set defaults if .txt files don't exist in folder
mailuser = ['226078'];
mailsender = ['226078'];
mailmessage = ['226078'];
sgnlink = 'https://goo.gl/forms/UBisBUjO4eg6pjfp1';
sslink = 'https://docs.google.com/spreadsheets/d/1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4/edit#gid=115661595';
ssmap =  'Cache';
ssmaplink = 'http://unfortunate-maps.jukejuice.com/static/previews/52272.png';
whitelist = [Poeticalto,Poeticaltwo];}

// Defines the certificates to connect to the mumble server through node-mumble
var options = {
	key: fs.readFileSync('botkey.pem'),
	cert: fs.readFileSync('botcerts.pem')
};


// connect to the mumble server
console.log('Connecting to Mumble Server');
console.log( 'Connecting' );
mumble.connect( mumbleurl, options, function ( error, connection ) {
    if( error ) { throw new Error( error ); }

    connection.authenticate( 'TToC_BOT' );

    connection.on( 'initialized', function () {
        console.log('connection ready');
		connection.user.setSelfDeaf(true);
		connection.user.setComment(help);
    });

var users = [];
var usersf = [];
var usersl = [];
	connection.on( 'userState', function (state) {
	if (users.indexOf(state.name) == -1 && greylist.indexOf(state.name) == -1){
	users.push(state.name);}
	if (users.indexOf(null) >-1){
		users.splice(users.indexOf(null),1); //unsure where the null leaks in from, but this removes it	
	}
	if (usersf.indexOf(state.name) == -1) {
	usersf.push(state.name);
	if (usersf.indexOf(null) >-1){
	usersf.splice(usersf.indexOf(null),1);
	for (i=0;i<usersf.length; i++){
		usersl[i] = usersf[i].toLowerCase();}}} 
});
	rl.on('line', (input) => {
	//console.log(`Received: ${input}`);
	connection.user.channel.sendMessage(input);
	});
	connection.on('user-disconnect', function(state) {
		if (greylist.indexOf(state.name) == -1){
		users.splice(users.indexOf(state.name),1);}
		if (users.indexOf(null) >-1){
		users.splice(users.indexOf(null),1);}
	if (usersf.indexOf(state.name) > -1) {
	usersf.splice(usersf.indexOf(state.name),1);
	if (usersf.indexOf(null) >-1){
	usersf.splice(usersf.indexOf(null),1);
	for (i=0;i<usersf.length; i++){
		usersl[i] = usersf[i].toLowerCase();}}} 		
	});

/* var channels = [];
connection.on( 'channelState', function (state) {
if (channels.indexOf(state.channel_id) == -1){
	channels.push(state.channel_id);}
}); */ //used to get a list of channel ids

connection.on('user-priority-speaker', function(user, status, actor) {
	if (whitelist.indexOf(actor.name)>-1 && status == true){
	if ( user.name == "TToC_BOT"){
	user.moveToChannel(actor.channel);
	actor.channel.sendMessage(actor.name+' has summoned me to this channel!');
	}
	else{
	user.moveToChannel(connection.user.channel);
	connection.user.channel.sendMessage(actor.name+' has moved '+user.name+' to '+connection.user.channel.name+'!');
}}
});



connection.on('message', function (message,actor,scope) {	
	console.log(actor.name);
	reply = "";
	const privateMessage = scope === 'private';
	const inChannel = actor.channel.name === connection.user.channel.name;
	const content = message || '';
	const isCommand = content[0] === '!';
	const contentPieces = content.slice(1, content.length).split(' ');
	const command = contentPieces[0].slice(0, contentPieces[0].length).split("<br")[0];
	console.log(command);
	var playerd = contentPieces[1];	
	if (contentPieces.length > 2){
	for (i=2; i <= contentPieces.length-1;i++) {		
		playerd = playerd + ' '+contentPieces[i];}}
	console.log(message);
 	if (isCommand && privateMessage) {
		switch( command ) {
			case 'backup': // this case is uneeded since function backup runs after each write, but is kept as a redundant measure.
				if (whitelist.indexOf(actor.name)>-1) {					
				backup();
				reply = "Everything has been backed up!";}
				else {
					reply = tohelp;}
				break;
			case 'ban':
				if (whitelist.indexOf(actor.name)>-1) {
					var playerd = contentPieces[2];	
						if (contentPieces.length > 3){
							for (i=3; i <= contentPieces.length-1;i++) {		
								playerd = playerd + ' '+contentPieces[i];}}
					if (playerd == undefined){
					playerd = '';}
					playerd = playerd + ' [banned by '+actor.name+']';
					connection.userByName(contentPieces[1]).ban(playerd);
				}
				else {
				reply = tohelp;}
				break;
			case 'blacklist':
				if (whitelist.indexOf(actor.name)>-1) {
				blacklist.push(playerd);
				reply = 'Added '+playerd+' to the blacklist!';
				backup();
				}
				else {
				reply = tohelp;}
				break;
			case 'cat':
				reply = cats();
				break;
			case 'cats':
				reply = "<br/>"+cats()+"<br/>"+cats()+"<br/>"+cats()+"<br/>"+cats()+"<br/>"+cats();
				break;
			case 'draft':
				if (draftstart == 0) {
					reply = tohelp;
				}
				else if (actor.channel.name != connection.user.channel.name) {
					reply = 'You are not a captain, please do not use this command.';}
				else if (playersr.length !== 0 && draftstart == 1 && drafted == 1) {
					reply = 'A pick is currently being processed, please wait...';}
				else if (playersr.length !== 0 && draftstart == 1 && drafted == 0) {
					playerdindex = playersr.indexOf(playerd);
					if (playerdindex > -1) {
						reply = 'Drafted ' + playerd;
						playersr.splice(playerdindex,1); 
						drafted = 1;
						draftplayer(playerd);}
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
					*/		// this is supposed to allow captains to draft by row number, unsure how to implement			
					else if (players.indexOf(playerd) == -1){
					reply = 'That player has already been taken! :c';}					
					else {
						reply = 'That player does not exist! Please make sure spelling/capitalization is correct!';}}
				else {
					reply = 'The draft has been completed! Thanks for drafting! C:';}
				break;
			case 'find':
				if (usersl.indexOf(playerd.toLowerCase()) > -1){
				playerd = usersf[usersl.indexOf(playerd.toLowerCase())];}
				
				if (connection.userByName(playerd) == undefined){
				reply = 'Sorry, a player with that name could not be found.';}
				else {
					var parentc = [];
					parentc.unshift(connection.userByName(playerd).channel.name);
					parentc.unshift(connection.userByName(playerd).channel.parent.name);
					while (connection.channelByName(parentc[0]).parent.name != 'North American TagPro Mumble'){
					parentc.unshift(connection.channelByName(parentc[0]).parent.name);}
					var mumbleurl = 'mumble://mumble.koalabeast.com';
				for (i = 0;i<parentc.length;i++){
				mumbleurl = mumbleurl+'/'+parentc[i].replace(/ /g,"%20");}
					console.log('test');
					console.log(mumbleurl);
					console.log(parentc);
					reply = '<br/>'+playerd+' was found in <a href="'+mumbleurl+'"><span style="color:#39a5dd">'+parentc[parentc.length-1]+'</span></a>';}
				break;
			case 'getmail':
				getmail(actor);
				break;
			case 'gg':
				if (playerd == undefined){
				 reply = "Please type a group name to find!";}
				else if (ggid.indexOf(playerd.toLowerCase()) > -1){
					reply = '<br/>Here is the '+playerd.toLowerCase()+' group:<br/><br/><a href="'+gglink[ggid.indexOf(playerd.toLowerCase())]+'"><span style="color:#39a5dd">'+gglink[ggid.indexOf(playerd.toLowerCase())]+'</span></a>'
				}
				else {
					reply = 'Sorry, a group with that name could not be found. :c';
				}
				break;
			/*case 'ggadd':
				if (contentPieces.length >2){
				ggadd = contentPieces[2];}
				else {
				ggadd = false;}
				if (contentPieces.length > 3){
					for (i=3; i <= contentPieces.length-1;i++) {		
					ggadd = ggadd + ' '+contentPieces[i];}}
				playerd = contentPieces[1].toLowerCase();
				if (ggadd == false){
				reply = "Sorry, a name was not specified to save under. Please try again.";}
				else {
					if (ggid.indexOf(ggadd) > -1){
							gglink[ggid.indexOf(ggadd)] = groupsend+groupid;
						}
					else {
						ggid.push(ggadd);
						gglink.push(groupsend+groupid);}}
				break;*/ //commented out until I figure out if it should be added or not.
			case 'greet':
				if (playerd == undefined){
				reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';}
				else {
					if (welcomeuser.indexOf(actor.name) > -1){
							welcomemessage[welcomeuser.indexOf(actor.name)] = playerd;
						}
						else {
							welcomeuser.push(actor.name);
						welcomemessage.push(playerd);
				}
				backup();
				reply = 'Your greeting has been set! TToC_BOT will send you this message each time you connect to the server! c:';}
				break;
			case 'greetcat':
				if (welcomeuser.indexOf(actor.name) > -1){
					welcomemessage[welcomeuser.indexOf(actor.name)] = 'this_is_supposed_to_be_a_cat-217253';}
				else {
						welcomeuser.push(actor.name);
						welcomemessage.push('this_is_supposed_to_be_a_cat-217253');}
				backup();
				reply = 'TToC_BOT will give you a cat each time you connect to the server! c:';
				break;
			case 'group':
				if (contentPieces.length >2){
				ggadd = contentPieces[2];}
				else {
				ggadd = false;}
				if (contentPieces.length > 3){
					for (i=3; i <= contentPieces.length-1;i++) {		
					ggadd = ggadd + ' '+contentPieces[i];}}
				playerd = contentPieces[1]
				if (playerd == undefined) {
				playerd = 'sphere';}
				else{
				playerd = playerd.toLowerCase();}
				groupbuild = 'http://tagpro-'+playerd+'.koalabeast.com/groups/create';
				groupsend = 'http://tagpro-'+playerd+'.koalabeast.com/groups/';
				groupid;
				request(
					{ method: 'POST'
					, uri: groupbuild
					, multipart:
					[{ 'follow_redirects': 'false'
					, body : JSON.stringify({public: "off"})}]}
					, function (error, response, body) {
					if (response != null){
					groupid = body.replace("Found. Redirecting to /groups/","");
					console.log(groupsend+groupid);
					reply = '<br/>Here is your '+playerd+' group:<br/><br/><a href="'+groupsend+groupid+'"><span style="color:#39a5dd">'+groupsend+groupid+'</span></a>';}
					else {
					reply = '<br/> There was an error when creating your group. Check to make sure you put an actual server! c:';}})
					function random3() {
					console.log(reply);
					actor.sendMessage(reply);
					if (ggadd != false && blacklist.indexOf(actor.name) == -1){ // players on the blacklist will be able to make groups but not add them to the public list of groups
						if (ggid.indexOf(ggadd) > -1){
							gglink[ggid.indexOf(ggadd)] = groupsend+groupid;
						}
						else {
							ggid.push(ggadd.toLowerCase());
						gglink.push(groupsend+groupid);
					}}}
					setTimeout(random3,500);
				break;
			case 'help':
				reply = help;
				break;
			case 'here':
				if (whitelist.indexOf(actor.name) > -1){
					connection.user.moveToChannel(actor.channel);
					actor.channel.sendMessage(actor.name+' has summoned me to this channel!');
				}
				else {
				actor.sendMessage(tohelp);}
				break;
			case 'home':
				if (whitelist.indexOf(actor.name) > -1){
					connection.user.moveToChannel('Meep is God');
					connection.channelByName('Meep is God').sendMessage(actor.name+' has sent me to this channel!');
				}
				else {
				actor.sendMessage(tohelp);}
				break;
			case 'info':
				reply = 'TToC, or the TagPro Tournament of Champions is a regular tournament hosted on the NA TagPro Mumble Server. Signups are usually released at 9:30 PM CST, with the draft starting at around 10:15 PM CST. I am a bot designed to run seasons of TToC. If you have any further questions, feel free to message Poeticalto on the Mumble server or /u/Poeticalto on Reddit.';
				break;
			case 'lock':
				if (whitelist.indexOf(actor.name) > -1){
				if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) == -1){				
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has put this channel on lockdown! No new users will be allowed unless moved by a whitelisted user.');
				console.log(actor.channel.name+' has been put on lockdown');
				lockchannel.push(actor.channel.name);}
				else if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) > -1){
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has downgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
				lockchannel.push(actor.channel.name);
				console.log(actor.channel.name+' has been downgraded to lockdown');
				lockschannel.splice(lockschannel.indexOf(actor.channel.name),1);}
				else if (lockchannel.indexOf(actor.channel.name) > -1 || lockschannel.indexOf(actor.channel.name) > -1){
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has lifted the channel lockdown! Users may now freely enter and leave.');
				lockchannel.splice(lockchannel.indexOf(actor.channel.name),1);
				lockschannel.splice(lockschannel.indexOf(actor.channel.name),1);
				console.log(actor.channel.name+' has been removed from lockdown');}}
				else {
				actor.sendMessage(tohelp);}
				break;
			case 'lock+':
				if (whitelist.indexOf(actor.name) > -1){
				if (lockchannel.indexOf(actor.channel.name) == -1 && lockschannel.indexOf(actor.channel.name) == -1){				
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has put this channel on super lockdown! No new users will be allowed to enter or leave unless moved by a whitelisted user.');
				lockschannel.push(actor.channel.name);
				console.log(actor.channel.name+' has been put on lockdown+');}
				else if (lockchannel.indexOf(actor.channel.name) > -1 && lockschannel.indexOf(actor.channel.name) == -1){
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has upgraded the channel lockdown! New users will not be allowed in unless moved by a whitelisted user.');
				console.log(actor.channel.name+' has been upgraded to lockdown+');
				lockschannel.push(actor.channel.name);
				lockchannel.splice(lockschannel.indexOf(actor.channel.name),1);}
				else if (lockchannel.indexOf(actor.channel.name) > -1 || lockschannel.indexOf(actor.channel.name) > -1){
				connection.channelByName(actor.channel.name).sendMessage(actor.name+' has lifted the channel lockdown! Users may now freely enter and leave.');
				console.log(actor.channel.name+' has been removed from lockdown+');
				lockchannel.splice(lockchannel.indexOf(actor.channel.name),1);
				lockschannel.splice(lockschannel.indexOf(actor.channel.name),1);}}
				else {
				actor.sendMessage(tohelp);}
				break;
			case 'kick':
				if (whitelist.indexOf(actor.name)>-1) {
					var playerd = contentPieces[2];	
						if (contentPieces.length > 3){
							for (i=3; i <= contentPieces.length-1;i++) {		
								playerd = playerd + ' '+contentPieces[i];}}
					if (playerd == undefined){
					playerd = '';}
					playerd = playerd + ' [kicked by '+actor.name+']';
					connection.userByName(contentPieces[1]).kick(playerd);
				}
				else {
				reply = tohelp;}
				break;
			case 'mail':				
				if (playerd == undefined){
				if (blacklist.indexOf(actor.name) == -1){
				var mailusertemp = contentPieces[1];
				var mailmestemp = contentPieces[2];
				for (i=3; i <= contentPieces.length-1;i++) {		
				mailmestemp = mailmestemp + ' '+contentPieces[i];}
				mailuser.push(mailusertemp);
				mailsender.push(actor.name);
				mailmessage.push(mailmestemp);
				reply = 'Your mail has been successfully created! Your receiver will receive it when they enter the server or use the !getmail command! c:';
				backup();}
				else {
				reply = "You don't have permission to do that! :c";}}
				else {
				reply = "No message was detected, please put one in before sending! c:";}	
				break;
			case 'map':
				reply = '<br/>The map for tonight is: <a href="'+ssmaplink+'"><b><i><span style="color:#00557f">'+ssmap+'</span></i></b></a>';
				break;
			case 'motd':
				reply = motd;
				break;
			case 'newseason':
				if(whitelist.indexOf(actor.name)>-1) {
					newseason = 1;
					reply = 'Resetting to original settings!';}
				else{
					reply = tohelp;}
				break;
			case 'qak':
				reply = 'qak';
				break;
			case 'resetseason':
				if (whitelist.indexOf(actor.name)>-1){
				console.log('resetting season!');
				reply = 'Resetting tourney vars!';
				//reset season vars here
				}
				else {
					reply = tohelp;}
				break;
			case 'setgreet':
				if(whitelist.indexOf(actor.name)>-1){
					if (contentPieces.length >2){
						ggadd = contentPieces[2];}
					else {
						ggadd = false;}
					if (contentPieces.length > 3){
						for (i=3; i <= contentPieces.length-1;i++) {		
							ggadd = ggadd + ' '+contentPieces[i];}}
					playerd = contentPieces[1];
					if (playerd == undefined){
					reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';}
					else {
						if (welcomeuser.indexOf(playerd) > -1){
							welcomemessage[welcomeuser.indexOf(playerd)] = ggadd;}
						else {
							welcomeuser.push(playerd);
							welcomemessage.push(ggadd);}
					backup();
					reply = 'Greeting has been set for '+playerd+'! They will receive this message each time they connect. c:';}
				}
				else{
					reply = tohelp;
				}
				break;
			case 'setgreetcat':
				if(whitelist.indexOf(actor.name)>-1){
					playerd = contentPieces[1];
					if (playerd == undefined){
					reply = 'No greeting was found, please create a message for the bot to send to you when you connect!';}
					else {
						if (welcomeuser.indexOf(playerd) > -1){
							welcomemessage[welcomeuser.indexOf(playerd)] = 'this_is_supposed_to_be_a_cat-217253';}
						else {
							welcomeuser.push(playerd);
							welcomemessage.push('this_is_supposed_to_be_a_cat-217253');}
					backup();
					reply = 'Greeting has been set for '+playerd+'! They will receive a cat each time they connect. c:';}
				}
				else{
					reply = tohelp;
				}
				break;
			case 'setupdraft':
				if (whitelist.indexOf(actor.name)>-1) {
					setupdraft = 1;
					reply = 'Setting up draft now!';
					reply = draftsetup();}
				else {
					reply = tohelp;}
				break;
			case 'setupsheet':
				if (whitelist.indexOf(actor.name)>-1) {
					setupsheet = 1;
					reply = 'Setting up sheet now!';
					sheetsetup();
					signupsopen = true;}
				else {
					reply = tohelp;}
				break;
			case 'signups':
				if (setupstart !== 0) {				
					reply = '<a href="'+sgnlink+'"><b><span style="color:#aa0000"><br/>Click here for the signups!</span></b></a>';}
				else {
					reply = 'Signups have not been released yet, check back in a bit! c:';}				
				break;
			case 'spreadsheet':
				if (setupstart !== 0) {				
					reply = '<br/><a href="'+sslink+'"><b><span style="color:#00007f">Click here for the spreadsheet!</span></b></a>';}
				else {
					reply = 'Signups have not been released yet, check back in a bit! c:';}				
				break;
			case 'stop':
				if (greylist.indexOf(actor.name) == -1){
				greylist.push(actor.name);
				backup();
				reply = "You've been added to the greylist! You will no longer receive automated messages from TToC_BOT when you connect.";}
				else {
					greylist.splice(greylist.indexOf(actor.name),1);
					backup();
				reply = "You've been removed from the greylist! You will now receive automated message from TToC_BOT when you connect.";}
				break;
			case 'stream':
				for (i=0; i < users.length; i++){
				//connection.userByName(users[i]).sendMessage('this is a quick test of the TToC_BOT tree function, please ignore c:');
				console.log(users[i]);}
				break;
			case 'time':
				reply = 'TToC was treed at 9:30 PM CST and the draft will start at around 10:15 PM CST.';
				break;
			case 'trade':
				if (whitelist.indexOf(actor.name)>-1) {
				var tradec1 = contentPieces[1];
				var tradec2 = contentPieces[2];
				var tradec1 = captains[tradec1];
				var tradec2 = captains[tradec2];				

				// switch captains on the spreadsheet, captains array, captainsmum array 
					reply = 'Successfully switched captains '+tradec1+' and '+tradec2;}
				else {
					reply = tohelp;}
				break;
			case 'tree':
				if(whitelist.indexOf(actor.name)>-1) {
					reply = 'look a tree';}
				else{
					reply = tohelp;}
				break;
			case 'updatelinks':
				if (whitelist.indexOf(actor.name)> -1){
				sslink = fs.readFileSync('sslink.txt').toString().split("\n");
				sgnlink = sslink[0];
				sslink = sslink[1];
				ssmap = fs.readFileSync('ssmap.txt').toString().split("\n");
				ssmaplink = ssmap[1];
				ssmap = ssmap[0];
				console.log('updating links!');
				reply = 'Updating links!';
				updatelinks();
				}
				else {
					reply = tohelp;}
				break;
			case 'updatemotd':
				if (whitelist.indexOf(actor.name)> -1){
					if (motdset == false){				
					motdset = true;
					playerd = parseInt(contentPieces[1]);
					motd = fs.readFileSync('motd.txt').toString().split("\n");
					console.log(playerd);
					console.log(Number.isInteger(playerd));
					console.log(motd.length);
					if (Number.isInteger(playerd) == true && playerd <= motd.length-1 && playerd >= 0) {
						motd = motd[playerd];}
					else {
						motd = motd[0];}
					motd = motd+sadbot;
					reply = 'motd has been updated and turned on!';					
					}
					else{
					motdset = false;
					reply = 'motd has been turned off!';
					motd = "Sorry, there's no motd set right now!";}
				}
				else {
					reply = tohelp;}
				break;
			case 'whitelist':
				if (whitelist.indexOf(actor.name)>-1) {
				whitelist.push(playerd);
				reply = 'Added '+playerd+' to the whitelist!';
				backup();}
				else{
				reply = tohelp;}
				break;
			default:
				reply = tohelp;
				break;
}
	if (command != 'getmail' || command != 'group' || command != 'lock' || command != 'lock+' || command != 'here'){
		console.log(reply);
		actor.sendMessage(reply);
		//connection.channelByName('Meep is God').sendMessage('this is a test');
		}
}});

connection.on('error',function(MumbleError){
	console.log(MumbleError.name);
})

connection.on('user-connect', function(user) {
	if(mailuser.indexOf(user.name)>-1){
user.sendMessage("Howdy "+user.name+"! I've been keeping some cool mail from other people for you, let me go get it!");
	getmail(user);}
	if(signupsopen == true && greylist.indexOf(user.name) == -1){
user.sendMessage("<br/>TToC signups are currently open for "+ssmap+"! If you want to signup, message me !signups or !spreadsheet<br/><br/>(If you don't want these automated messages, message the !stop command to me)");}
	else if(greylist.indexOf(user.name) == -1 && signupsopen == false && motdset == true){
	user.sendMessage(motd);}
	else if (welcomeuser.indexOf(user.name) > -1 && signupsopen == false && motdset == false){
		if (welcomemessage[welcomeuser.indexOf(user.name)] == 'this_is_supposed_to_be_a_cat-217253'){
		user.sendMessage("<br/>TToC_BOT sends a cat to say hi!<br/><br/>"+cats()+"<br/>");}
		else {user.sendMessage(welcomemessage[welcomeuser.indexOf(user.name)]);}
	}	
	else if(greylist.indexOf(user.name) == -1 && signupsopen == false && motdset == false){
//user.sendMessage("<br/>TToC_BOT sends a cat to say hi!<br/><br/>"+cats()+"<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)");
	}});

   connection.on('user-move', function(user, fromChannel, toChannel, actor) {
	if ((lockchannel.indexOf(toChannel.name) > -1 || lockschannel.indexOf(toChannel.name) > -1) && actor.name != 'TToC_BOT' && whitelist.indexOf(actor.name) == -1){
		user.moveToChannel('TToC');
		user.sendMessage('Sorry, you cannot enter this channel right now. :c');
		connection.channelByName(toChannel.name).sendMessage(user.name+' was prevented from entering this channel!');}
	else if (lockschannel.indexOf(fromChannel.name) > -1 && actor.name != 'TToC_BOT' && whitelist.indexOf(actor.name) == -1){
		user.moveToChannel(fromChannel.name);
		user.sendMessage('Sorry, you cannot leave this channel right now. :c');
		connection.channelByName(fromChannel.name).sendMessage(user.name+' was prevented from leaving this channel!');}
	else if (connection.user.channel.name == toChannel.name && user.name != 'TToC_BOT' && actor.name != 'TToC_BOT') {
	connection.user.channel.sendMessage('Welcome to '+toChannel.name+' '+user.name+'!');}
	if(mailuser.indexOf(user.name)>-1){
	user.sendMessage("This is an automated reminder from TToC_BOT that you have some mail! Message !getmail to me when you're ready to receive it! c:");}
	//if (toChannel.name == 'TToC' && captainsmum.indexOf(user.name)>-1 && draftsetup == 1){
	//user.moveToChannel('Draft Channel');
	//connection.user.channel.sendMessage(user.name+'has been moved into the draft channel!');
	//user.sendMessage('You have been moved to the draft channel!');}
	//else if (toChannel.name == 'TToC' && draftsetup == 1){
	//random stuff	
	//}
});

function sheetsetup() {
	console.log('setupsheet has been activated!');
	console.log('Running Form Setup Script');
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
function random1() {
	scriptname = 'FormSetup';
authorize(JSON.parse(content), gscriptrun);}
function random2() {
	scriptname = 'SheetSetup';
authorize(JSON.parse(content), gscriptrun);}
random1();
setTimeout(random2,15000);
});

updatelinks();
}
function draftsetup(){
	console.log('setupdraft has been activated!');
	console.log('Running Draft Setup Script');
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  scriptname = 'DraftBoardSetup';
authorize(JSON.parse(content), gscriptrun);
});
	/*run draftboardsetup
	retrieve the following vars/arrays:
	players (duplicate to playersr)
	captains
	season size	
	*/
	for (i=1; i<=seasonsize; i++){
	captainspick.push(i);}
	for (i=seasonsize; i>0; i--){
	captainspick.push(i);}
	for (i=seasonsize; i>0; i--){
	captainspick.push(i);}
	switch(seasonsize){
		case 3:
			draftmod = 7+5;
			break;
		case 4:
			draftmod = 13+5;
			break;
		case 6:
			draftmod = 16+5;
			break;
		case 8:
			draftmod = 20+5;
			break;
		case 9:
			draftmod = 20+5;
			break;
		case 12:
			draftmod = 23+5;
			break;
		case 16:
			draftmod = 30+5;
			break;
		case 18:
			draftmod = 32+5;
			break;
		case 21:
			draftmod = 35+5;
			break;
		case 24:
			draftmod = 38+5;
			break;
		default:
			draftmod = -1;
			break;}
// Assign captains to mumble names
var captainsmum = new Array(seasonsize);}

function pickrefresh(){
/* refresh the following vars:
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

function draftstrt(){
	console.log('draftstart has been activated!');
	console.log('Starting Draft!');
	draftround = 1;
	draftstart = 1;
	drafted = 0;
}

function backup(){
	console.log('backing up data!');
	fs.writeFileSync('mailuser.txt',mailuser.join('\n'));
	fs.writeFileSync('mailmessage.txt',mailmessage.join('\n'));
	fs.writeFileSync('mailsender.txt',mailsender.join('\n'));
	fs.writeFileSync('blacklist.txt',blacklist.join('\n'));
	fs.writeFileSync('greylist.txt',greylist.join('\n'));
	fs.writeFileSync('whitelist.txt',whitelist.join('\n'));
	fs.writeFileSync('welcomemessage.txt',welcomemessage.join('\n'));
	fs.writeFileSync('welcomeuser.txt',welcomeuser.join('\n'));
	console.log('data has been backed up!');
}



function draftplayer(playerd){
	console.log(playerd+' is being drafted!');
	connection.user.channel.sendMessage(playerd+' has been drafted by ');
	//update spreadsheet with player
	drafted = 0;
	picknum = picknum + 1;
	draftround = Math.floor(picknum/seasonsize)+1;
}

function updatelinks() {
	console.log('updatelinks has been activated!');
	console.log('Retrieving links from the spreadsheet!');
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
function random4() {
ssreadfrom = "'Hall of Fame'!B17:B23";
authorize(JSON.parse(content), ssread);}
random4();
});
}

function getmail(actor) {
	if(mailuser.indexOf(actor.name)>-1){
	actor.sendMessage("Howdy "+actor.name+"! Let me go get your mail!");
	randomvar = 1;
	while(mailuser.indexOf(actor.name)>-1) {	
	var messagegeti = mailuser.indexOf(actor.name);
	actor.sendMessage('Message from: '+mailsender[messagegeti]);				
	actor.sendMessage(mailmessage[messagegeti]);
	mailuser.splice(messagegeti,1);
	mailmessage.splice(messagegeti,1);
	mailsender.splice(messagegeti,1);}
	actor.sendMessage("That's all of your messages for now! If you want to reply to your mail, message me with the command !mail user message! Have a great day! c:");
	backup();}
	else{
	actor.sendMessage("Sorry, you don't have any mail. :c");}}

});