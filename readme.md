# ttoc-mumble-bot 

---

## General Info

ttoc-mumble-bot is a bot written in node.js designed for the TagPro Tournament of Champions and operated through the NA TagPro Mumble Server.

This bot is designed to utilize three APIs in addition to the node-mumble package [used to connect to the mumble server]:

Google API- used to communicate with the TToC spreadsheet and run tournament seasons

Slack API - used to send automated messages on user kick/ban

GroupMe API- used as a chat bridge to connect a group and a mumble channel

While API keys are required for each of these APIS, the bot will function (albeit without the commands which use the APIs) just fine without them.

ttoc-mumble-bot also has a [companion userscript found here](https://gist.github.com/Poeticalto/00de8353fce79cac9059b22f20242039) which allows a user to create groups set up for competitive TagPro.

---

## Setup

ttoc-mumble-bot requires a certificate in order to connect to a mumble server, but doesn't require anything else to be functional.

You can use the following command to generate a certificate: <pre><code> openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem </code></pre>

Using npm install may cause some issues with node-gyp rebuild if you haven't set it up before. Use the following command in Windows PowerShell to fix it: <pre><code> npm install -g windows-build-tools </code></pre>

ttoc-mumble-bot saves all information in .txt files. I'm working on making a better system, but this works for now. All .txt files which don't have API info are created on first launch by the bot if they don't already exist.

Info on how to set up the three APIs can be found in later sections of this readme.

Here's how each .txt file is structured:

groupmekey.txt = This .txt file holds API info for the [GroupMe API](https://dev.groupme.com/docs/v3) as follows:

Line # | Content | Description
:---: | :---: | :---:
1 | ACCESS_TOKEN | This is the access token for your account, not the bot.
2 | USER_ID | This is your user id, not the bot.
3 | GMBOT | This is the name of your groupme bot.
4 | USER_NAME | This is your name in the group, can be used to filter out your messages.
5 | GROUP_ID | This is the group to listen to.

mailmessage.txt = This .txt file is part of the mail system and holds the message to send to other Mumble users, one per line.

mailsender.txt = This .txt file is part of the mail system and holds the sender of the message, one per line.

mailuser.txt = This .txt file is part of the mail system and holds the receiver of the message, one per line.

motd.txt = This .txt file holds motd messages for the motd system, one per line.

slacktoken.txt = This .txt file holds API info for the [Slack API](https://api.slack.com/custom-integrations/web) as follows:

Line # | Content | Description
:---: | :---: | :---:
1 | slacktoken | This uses a [legacy token](https://api.slack.com/custom-integrations/legacy-tokens) to communicate with slack.
2 | slackchannel | This is the channel id for the Slack Channel receiving messages.

sslink.txt = This .txt file holds information from the spreadsheet for The TagPro Tournament of Champions. Its format is as follows:

Line # | Content | Description
:---: | :---: | :---:
1 | name [unused in code] | Name/identifier of the tournament
2 | seasonnum | Season # of the tournament
3 | server [unused in code] | Server of the tournament
4 | ssmap | Name of the map being played
5 | ssmaplink | link to a .png of the map being played
6 | ssform | link to the form of the tournament
7 | sslink | link to the tournament spreadsheet

usergroups.txt = This .txt file holds the user groups for the bot, each group on one line and each name separated by spaces. Its format is as follows:

Line # | Content | Description
:---: | :---: | :---:
1 | whitelist | superusers of the bot, have access to all commands
2 | mods | Public mods. In the code, members of this group can be found with the !mods command if they are on.
3 | pseudoMods | Private mods. Have all the power of mods but none of the publicity.
4 | greylist | Users who do not want automated messages from the bot.
5 | blacklist | Bad users who cannot use commands with spam potential.

welcomemessage.txt = This .txt file is part of the greeting system and holds user greetings, one per line.

welcomeuser.txt = This .txt file is part of the greeting system and holds users associated with greetings, one per line.

whitelist.txt = This .txt holds mumble users on the whitelist, one per line.

---

## User Groups

There are three groups of users recognized by the bot:

Whitelist: Whitelisted users have access to all commands.

Moderators: Moderators have access to public commands, lock, and kicking/banning users through the bot. Mostly used as an identifier for TagPro mods.

Users: Regular users have access to public commands.

---

## Connecting to the Google API

Google API/Google Sheets requires an OAuth token for any attempt to run scripts/work on spreadsheets.

If you have never created a project via Google API, [consult this guide.](https://developers.google.com/apps-script/guides/rest/quickstart/nodejs)

ttoc-mumble-bot is natively set up to communicate with the [TToC Spreadsheet,](https://docs.google.com/spreadsheets/d/1eeYA5IVd-f3rjyUqToIwAa7ZSrnvnDXj5qE0f0hF_X4/edit#gid=115661595) but if you want to make your own TagPro Tournament, you can make a copy of [this spreadsheet.]() Making a copy of this spreadsheet will also create a copy of the backbone scripts used to operate the spreadsheet.

If you only want the backbone scripts, [you can find them here.](https://gist.github.com/Poeticalto/ed06fab60c8ac8649e33f42aecbec837) You will have to change the code to match your setup, but it is well commented with its function.

NOTE: Because the bot communicates with the Google API to run scripts on the cloud, your scripts must be 'Deployed as an API Executable' through the Publish menu in the script editor.

The options section must be adjusted with links to both the scripts and the spreadsheet being used.

---

## Connecting to the Slack API

Slack requires an API token to utilize the API, [which can be retrieved here.](https://api.slack.com/custom-integrations/legacy-tokens)

Right now, ttoc-mumble-bot is connected via a legacy token. Integration support will be added if it ever happens.

In order to send messages to a channel, you need a channel ID, which can be found by visiting slack in a web browser and going to said channel.

[Click here if you need some more info on the node library for Slack.](https://github.com/slackapi/node-slack-sdk)

---

## Connecting to the GroupMe API

GroupMe requires an API token to utilize the API, [which can be retrieved here.](https://dev.groupme.com/bots)

Follow the table above to see how to set up the .txt file for the GroupMe API.

[Click here if you need more info on the node library for GroupMe.](https://github.com/njoubert/node-groupme)

---

## Public Commands

Here is a list of public commands:

!cat - Gives one cat.

!cats - Want more cats? How about five?

!find user - If the user is on the Mumble Server, a link will be provided to move to their channel. User is case-insensitive.

!greet message - Sets a greeting for the user that will be sent on connect.

!greetcat - TToC_BOT will greet the user with a cat that will be sent on connect.

!getmail - Retrieves your mail.

!gg name - Returns a group link if a group has been registered through the bot.

!group server name - Gives a TagPro group for the corresponding server. You can optionally set a name so other players can access it via the !gg command.

!groupc server map name - Gives a competitive group for the corresponding server and map. You can optionally set a name so other players can access it via the !gg command.

!groupt name - Gives a competitive group that is set up for the tournament. You can optionally set a name so other players can access it via the !gg command.

!help - Gives user the help message

!info - Gives user info about me 

!mail user message - Stores a message for another user to get. They will receive it the next time they enter the server or when they use the !getmail command. The message should just be plain text.

!map - Gives user the map for the current season

!mods - Lists the mods currently connected to the Mumble Server.

!motd - Gives the current motd of the bot.

!qak - qak

!signups - Gives user the signup link

!spreadsheet - Gives user the spreadsheet link

!stop - Adds user to the greylist, which stops the bot from sending automated messages. If done again, user is removed, which lets TToC_BOT send messages again.

!time - Gives user the time of the draft.

---

## Whitelist Commands/Behaviors

Here is a list of whitelist commands:

!backup - redundant command since backup happens every time a .txt file is changed, but it's kept just in case.

!ban user reason - bans user from the Mumble Server. The actor is noted in the reason.

!blacklist user- adds user to the blacklist.

!chat - activates/deactivates the GroupMe bridge. Will send messages back and forth between a GroupMe group and the Mumble Channel.

!ggadd url name - This isn't a whitelist command but is disabled by default. Adds a link to the bot which can be accessed by the !gg command.

!here - moves the bot to the actor's channel.

!home - moves the bot to its predefined home.

!lock - prevents users from entering the actor's channel. Users on the moderators group or whitelist can bypass the lock, as well as any users moved by a member of those groups.

!lock+ - prevents users from entering or leaving the actor's channel. Users on the moderators group or whitelist can bypass the lock, as well as any users moved by a member of those groups. Also known as the hostage command.

!kick user reason - kicks user from the Mumble Server. The actor is noted in the reason.

!move user - moves the user to the channel of the actor.

!setgreet user message - allows a whitelisted user to set a custom greeting for any Mumble user.

!setgreetcat user - allows a whitelisted user to set a custom cat greeting for any Mumble user.

!setupdraft - Connects to the Google Scripts API and sets up a draft board.

!setupsheet - Connects to the Google Scripts API and sets up a new season for the tournament.

!trade captain1 captain2 -trades the position of two captains on the draft board.

!updatelinks - Connects to the Google Sheets API and retrieves links to everything.

!updatemotd line# - Allows a user to set custom motd messages as the active one.

!whitelist user - Adds user to the whitelist.

### Whitelist non-commands

Whitelisted users also have some fun behavior relating to the bot:

Giving priority speaker to a user will move the user to the same channel as the bot. This functionality also works if you do it on yourself.

Giving priority speaker to the bot when it isn't in the same channel as the user will move the bot to the same channel as the user.

Giving priority speaker to the bot when it is in the same channel as the user will move the bot to its predefined home.

---

## Special Thanks

Special thanks to Gem the TagPro dev for her invaluable help in debugging the bot. c:

---

## Todo

1. Ability to reset seasons

2. Piping audio through node-mumble-audio

2a. Music bot?

3. Code cleanup/refactoring