var mumble = require('mumble');
var fs = require('fs');
const isEmpty = require('lodash').isEmpty;
//var isNumber = require('is-number');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var sheets = google.sheets('v4');
var spreadsheetId = '1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4';
var captainsmum;
var status = true;
var signupsopen = false;
var cool = require('cool-ascii-faces');
var cats = require('cat-ascii-faces');
// This part is the code used to authenticate with Google API
var SCOPES = ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/forms'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'script-nodejs-quickstart.json';
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

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
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

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
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

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
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
var scriptId = 'MR8ANgNM86TUijo7WF5u3bAUVXR8RJHBv';
var script = google.script('v1');
function spreadformsetup(auth) {

  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      function: 'FormSetup'
    },
    scriptId: scriptId
  }, function(err, resp) {
    if (err) {
      // The API encountered a problem before the script started executing.
      console.log('The API returned an error: ' + err);
      return;
    }
    if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details. The values of this
      // object are the script's 'errorMessage' and 'errorType', and an array
      // of stack trace elements.
      var error = resp.error.details[0];
      console.log('Script error message: ' + error.errorMessage);
      console.log('Script error stacktrace:');

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

function spreadsheetsetup(auth) {
  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      function: 'SheetSetup'
    },
    scriptId: scriptId
  }, function(err, resp) {
    if (err) {
      // The API encountered a problem before the script started executing.
      console.log('The API returned an error: ' + err);
      return;
    }
    if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details. The values of this
      // object are the script's 'errorMessage' and 'errorType', and an array
      // of stack trace elements.
      var error = resp.error.details[0];
      console.log('Script error message: ' + error.errorMessage);
      console.log('Script error stacktrace:');

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

function spreaddraftboardsetup(auth) {
  // Make the API request. The request object is included here as 'resource'.
  script.scripts.run({
    auth: auth,
    resource: {
      function: 'DraftBoardSetup'
    },
    scriptId: scriptId
  }, function(err, resp) {
    if (err) {
      // The API encountered a problem before the script started executing.
      console.log('The API returned an error: ' + err);
      return;
    }
    if (resp.error) {
      // The API executed, but the script returned an error.

      // Extract the first (and only) set of error details. The values of this
      // object are the script's 'errorMessage' and 'errorType', and an array
      // of stack trace elements.
      var error = resp.error.details[0];
      console.log('Script error message: ' + error.errorMessage);
      console.log('Script error stacktrace:');

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
// End of defining google apps scripts



// Var set
var drafted = 0;
var draftstart = 0;
var draftsetup = 1;
var setupstart = 1;
var players = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x"];
var playersr = players;
var captains = ["Poeticalto"];
var captainspick = [0];
var picknum = 1;
var newseason = 0;
var setupsheet = 0;
var setupdraft = 0;
var sgnlink = 'https://goo.gl/forms/UBisBUjO4eg6pjfp1';
var sslink = 'https://docs.google.com/spreadsheets/d/1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4/edit#gid=115661595';
var ssmap =  'Cache';
var ssmaplink = 'http://unfortunate-maps.jukejuice.com/static/previews/52272.png';
var tohelp = 'Sorry, I did not recognize that. Use !help for a list of public commands! c:';
var wait = 0;
var reply = '';
var tree = '';
var seasonsize = 6;
var draftmod = 21;
var playerdindex = 0;
var draftround = 1;
var mumbleurl = 'mumble.koalabeast.com';
var whitelist = ['Poeticalto','Poeticaltwo'];
var blacklist;
var greylist;

var mailuser;
var mailsender;
var mailmessage;
if (fs.existsSync('mailuser.txt')) {
mailuser = fs.readFileSync('mailuser.txt').toString().split("\n");
mailsender = fs.readFileSync('mailsender.txt').toString().split("\n");
mailmessage = fs.readFileSync('mailmessage.txt').toString().split("\n");
sslink = fs.readFileSync('sslink.txt').toString().split("\n");
sgnlink = sslink[0];
sslink = sslink[1];
ssmap = fs.readFileSync('ssmap.txt').toString().split("\n");
ssmaplink = ssmap[1];
ssmap = ssmap[0];
whitelist = fs.readFileSync('whitelist.txt').toString().split("\n");
blacklist = fs.readFileSync('blacklist.txt').toString().split("\n");
greylist = fs.readFileSync('greylist.txt').toString().split("\n");
}
else {
mailuser = ['226078'];
mailsender = ['226078'];
mailmessage = ['226078'];
sgnlink = 'https://goo.gl/forms/UBisBUjO4eg6pjfp1';
sslink = 'https://docs.google.com/spreadsheets/d/1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4/edit#gid=115661595';
ssmap =  'Cache';
ssmaplink = 'http://unfortunate-maps.jukejuice.com/static/previews/52272.png';
whitelist = [Poeticalto,Poeticaltwo];}

var options = {
	key: fs.readFileSync('botkey.pem'),
	cert: fs.readFileSync('botcerts.pem')
};

console.log('Connecting to Mumble Server');
console.log( 'Connecting' );
mumble.connect( mumbleurl, options, function ( error, connection ) {
    if( error ) { throw new Error( error ); }

    connection.authenticate( 'TToC_BOT' );

    connection.on( 'initialized', function () {
        console.log('connection ready');
    });

    // Show all incoming events and the name of the event which is fired.
    connection.on( 'protocol-in', function (data) {
        //console.log('data', data.message);
});

	var sessions = {};
    connection.on( 'userState', function (state) {
        sessions[state.session] = state;
    });

    // Collect channel information
    var channels = {};
    connection.on( 'channelState', function (state) {
        channels[state.channelId] = state;
});

connection.on('userState',function(state){
sessions[state.session] = state;
});

   connection.on('user-move', function(user, fromChannel, toChannel, actor) {
	//if (toChannel.name == 'TToC' && captainsmum.indexOf(user.name)>-1 && draftsetup == 1){
	//user.moveToChannel('Draft Channel');
	//connection.user.channel.sendMessage(user.name+'has been moved into the draft channel!');
	//user.sendMessage('You have been moved to the draft channel!');}
	//else if (toChannel.name == 'TToC' && draftsetup == 1){
	//random stuff	
	//}
});


connection.on('user-priority-speaker', function(user, status, actor) {
	if (whitelist.indexOf(actor.name)>-1){
	try { 
	user.moveToChannel('Draft Channel');}
	catch(err){
	actor.sendMessage("Sorry, couldn't move "+user.name+". Try checking the permissions of the channel!");
	console.log('Failed to move '+user.name);}
	connection.user.channel.sendMessage(actor.name+' has sent '+user.name+' to the Draft Channel!');
	user.sendMessage("You've been moved by "+actor.name+" to prepare for the draft!! :c");
	}
});



connection.on('message', function (message,actor,scope) {	
	console.log(actor.name);
	switch(scope){
		case 'private':
			privateMessage = true;
			break;
		default:
			privateMessage = false;
			break;}
	const content = message || '';
	const isCommand = content[0] === '!';
	const contentPieces = content.slice(1, content.length).split(' ');
	const command = contentPieces[0];
	var playerd = contentPieces[1];	
	if (contentPieces.length > 2){
	for (i=2; i <= contentPieces.length-1;i++) {		
		playerd = playerd + ' '+contentPieces[i];}}
	console.log(playerd);
 	if (isCommand && privateMessage) {
		switch( command ) {
			case 'draft':
				if (draftstart == 0) {
					reply = 'The draft has not started! Check back in a bit! c:';
				}
				else if (captainsmum[captainspick[picknum]] != actor.name) {
					reply = 'You are not a captain, please do not use this command.';}
				else if (playersr.length !== 0 && draftstart == 1 && drafted == 1) {
					reply = 'A pick is currently being processed, please wait...';}
				else if (playersr.length !== 0 && draftstart == 1 && drafted == 0 && captainsmum[captainspick[picknum]] == actor.name) {
					playerdindex = playersr.indexOf(playerd);
					if (playerdindex > -1) {
						reply = 'Drafted ' + playerd;
						playersr.splice(playerdindex,1); 
						drafted = 1;
						draftplayer(playerd);}
					//else if (isNumber(playerd) == true && playerd > 0 && playerd < 120) {
					//var playerdi = playerd;
					//if (players.length <= playerdi-draftmod){
					//	playerd = players[playerdi-draftmod];
					//	playerdindex = playersr.indexOf(playerd);
					//	if (playerdindex > -1) {
					//		reply = 'Drafted ' + playerd;
					//		playersr.splice(playerdindex,1); 
					//		drafted = 1;}
					//	else {
					//reply = 'That player has already been taken! :c';}}}
					else if (players.indexOf(playerd) == -1){
					reply = 'That player has already been taken! :c';}					
					else {
						reply = 'That player does not exist! Please make sure spelling/capitalization is correct!';}}
				else {
					reply = 'The draft has been completed! Thanks for drafting! C:';}
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
			case 'time':
				reply = 'TToC was treed at 9:30 PM CST and the draft will start at around 10:15 PM CST.';
				break;
			case 'random':
				reply = cool();
				break;
			case 'help':
				reply = '<br/><b>!help</b> - Gives user the help message<br/><b>!info</b> - Gives user info about me <br/><b>!map</b> - Gives user the map for the current season<br/><b>!signups</b> - Gives user the signup link<br/><b>!spreadsheet</b> - Gives user the spreadsheet link<br/><b>!time</b> - Gives user the time of the draft<br/><b>!mail<span style="color:#aa0000"> user </span><span style="color:#0000ff">message</span></b> - Stores a message for another user to get. They will receive it the next time they enter the server or when they use the !getmail command. The message should just be plain text.<br/><br/><b>!getmail</b> - Retrieves your mail.<br/>';
				break;
			case 'newseason':
				if(whitelist.indexOf(actor.name)>-1) {
					newseason = 1;
					reply = 'Resetting to original settings!';}
				else{
					reply = tohelp;}
				break;
			case 'setupsheet':
				if (whitelist.indexOf(actor.name)>-1) {
					setupsheet = 1;
					reply = 'Setting up sheet now!';
					sheetsetup();}
				else {
					reply = tohelp;}
				break;
			case 'setupdraft':
				if (whitelist.indexOf(actor.name)>-1) {
					setupdraft = 1;
					reply = 'Setting up draft now!';
					reply = draftsetup();}
				else {
					reply = tohelp;}
				break;
			case 'tree':
				if(whitelist.indexOf(actor.name)>-1) {
					reply = 'look a tree';}
				else{
					reply = tohelp;}
				break;
			case 'info':
				reply = 'TToC, or the TagPro Tournament of Champions is a regular tournament hosted on the NA TagPro Mumble Server. Signups are usually released at 9:30 PM CST, with the draft starting at around 10:15 PM CST. I am a bot designed to run seasons of TToC. If you have any further questions, feel free to message Poeticalto on the Mumble server or /u/Poeticalto on Reddit.';
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
			case 'map':
				reply = '<br/>The map for tonight is: <a href="'+ssmaplink+'"><b><i><span style="color:#00557f">'+ssmap+'</span></i></b></a>';
				break;
			case 'whitelist':
				if (whitelist.indexOf(actor.name)>-1) {
				whitelist.push(playerd);
				reply = 'Added '+playerd+' to the whitelist!';}
				else{
				reply = tohelp;}
				break;
			case 'mail':
				if (blacklist.indexOf(actor.name) == -1){
				var mailusertemp = contentPieces[1];
				var mailmestemp = contentPieces[2];
				for (i=3; i <= contentPieces.length-1;i++) {		
				mailmestemp = mailmestemp + ' '+contentPieces[i];}
				mailuser.push(mailusertemp);
				mailsender.push(actor.name);
				mailmessage.push(mailmestemp);
				reply = 'Your mail has been successfully created! Your receiver will receive it when they enter the server or use the !getmail command! c:';}
				else {
				reply = "You don't have permission to do that! :c";}	
				break;
			case 'getmail':
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
				actor.sendMessage("That's all of your messages for now! If you want to reply to your mail, message me with the command !mail user message! Have a great day! c:");}
				else{
				actor.sendMessage("Sorry, you don't have any mail. :c");}
				break;
			case 'stop':
				greylist.push(actor.name);
				reply = "You've been added to the greylist!";
				break;
			case 'backup':
				if (whitelist.indexOf(actor.name)>-1) {					
				fs.writeFileSync('mailuser.txt',mailuser.join('\n'));
				fs.writeFileSync('mailmessage.txt',mailmessage.join('\n'));
				fs.writeFileSync('mailsender.txt',mailsender.join('\n'));
				fs.writeFileSync('blacklist.txt',blacklist.join('\n'));
				fs.writeFileSync('greylist.txt',greylist.join('\n'));
				fs.writeFileSync('whitelist.txt',whitelist.join('\n'));
				reply = "Everything has been backed up!";}
				else {
					reply = tohelp;}
				break;				
			default:
				reply = tohelp;
				break;
}
	if (command != 'getmail'){
		console.log(reply);
		actor.sendMessage(reply);}
}});

connection.on('user-connect', function(user) {
	if(mailuser.indexOf(user.name)>-1){
user.sendMessage("Howdy "+user.name+"! I've been keeping some cool mail from other people for you, let me go get it!");
	randomvar = 1;
	while(mailuser.indexOf(user.name)>-1) {	
				var messagegeti = mailuser.indexOf(user.name);
				user.sendMessage('Message from: '+mailsender[messagegeti]);				
				user.sendMessage(mailmessage[messagegeti]);
				mailuser.splice(messagegeti,1);
				mailmessage.splice(messagegeti,1);
				mailsender.splice(messagegeti,1);}
				user.sendMessage("That's all of your messages for now! If you want to reply to your mail, message me with the command !mail user message! Have a great day! c:");}
	if(user.name == 'mik'){
user.sendMessage('quibble sends her greetings to you! c: (This is an automated message from TToC_BOT)');}
	if(signupsopen == true && greylist.indexOf(user.name) == -1){
user.sendMessage("<br/>TToC signups are currently open for "+ssmap+"! If you want to signup, message me !signups or !spreadsheet<br/><br/>(If you don't want these automated messages, message the !stop command to me)");}
	if(greylist.indexOf(user.name) == -1 && gerylist.indexOf(user.name) == -1){
user.sendMessage("<br/>TToC_BOT sends a cat to say hi!<br/><br/>"+cats()+"<br/><br/>(If you don't want these automated messages when you connect, message the !stop command to me.)");}
});

   connection.on('user-move', function(user, fromChannel, toChannel, actor) {
	if (connection.user.channel.name == toChannel.name) {
	connection.user.channel.sendMessage('Welcome to '+toChannel.name+' '+user.name+'!');}
	if(mailuser.indexOf(user.name)>-1){
	user.sendMessage("This is an automated reminder from TToC_BOT that you have some mail! Message !getmail to me when you're ready to receive it! c:");}
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
authorize(JSON.parse(content), spreadformsetup);}
function random2() {
authorize(JSON.parse(content), spreadsheetsetup);}
random1();
setTimeout(random2,15000);
});
	

/*
	retrieve the following vars:
	spreadsheet link
	form link
	*/
}
function draftsetup(){
	console.log('setupdraft has been activated!');
	console.log('Running Draft Setup Script');
	fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
authorize(JSON.parse(content), spreaddraftboardsetup);
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


function draftplayer(playerd){
	console.log(playerd+' is being drafted!');
	connection.user.channel.sendMessage(playerd+' has been drafted by ');
	//update spreadsheet with player
	drafted = 0;
	picknum = picknum + 1;
	draftround = Math.floor(picknum/seasonsize)+1;
}

});
