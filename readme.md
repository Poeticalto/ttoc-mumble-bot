# ttoc-mumble-bot 

---

## General Info

ttoc-mumble-bot is a bot written in node.js designed for the TagPro Tournament of Champions and operated through the NA TagPro Mumble Server.

This bot is designed to utilize three apis in addition to the node-mumble package [used to connect to the mumble server]:

Google API- used to communicate with the TToC spreadsheet and run seasons

Slack API - used to send automated messages on user kick/ban

GroupMe API- used as a chat bridge to connect a group and a mumble channel

While API keys are required for each of these APIS, the bot will function (albeit without the commands which use the APIS) just fine without them.

---

## Setup

ttoc-mumble-bot requires a certificate in order to connect to a mumble server.

You can use the following command to generate a certificate: <pre><code>openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem</code></pre>

ttoc-mumble-bot saves all information in .txt files. I'm working on making a better system, but this works for now. All .txt files which don't have API info are created on first launch by the bot.

Here's how each .txt file is structured:

blacklist.txt = This .txt file holds mumble users on the blacklist, one per line.

greylist.txt = This .txt file holds mumble users on the greylist, one per line.

groupmekey.txt = This .txt file holds API info for the [GroupMe API](https://dev.groupme.com/docs/v3) as follows:

Line # | Content | Description
:---: | :---: | :---:
1 | ACCESS_TOKEN | This is the access token for your account, not the bot.
2 | USER_ID | This is your user id, not the bot.
3 | GMBOT | This is the name of your groupme bot.
4 | USER_NAME | This is your name in the group, can be used to filter out your messages.
5 | GROUP_ID | This is the group to listen to.

---

## User Groups

There are three groups of users recognized by the bot:

Whitelist: Whitelisted users have access to all commands.

Moderators: Moderators have access to public commands, lock, and kicking/banning users through the bot. Mostly used as an identifier for TagPro mods.

Users: Regular users have access to public commands.

---

## Public Commands

Here is a list of public commands:

!cat - Gives one cat.

!cats - Want more cats? How about five?

!greet message - Sets a greeting for the user that will be sent on connect.

!greetcat - TToC_BOT will greet the user with a cat that will be sent on connect.

!getmail - Retrieves your mail.

!gg name - Returns a group link if a group has been registered through the bot.

!group server name - Gives a TagPro group for the corresponding server. You can optionally set a name so other players can access it via the !gg command.

!help - Gives user the help message

!info - Gives user info about me 

!mail user message - Stores a message for another user to get. They will receive it the next time they enter the server or when they use the !getmail command. The message should just be plain text.

!map - Gives user the map for the current season

!motd - Gives the current motd of the bot.

!qak - qak

!signups - Gives user the signup link

!spreadsheet - Gives user the spreadsheet link

!stop - Adds user to the greylist, which stops the bot from sending automated messages. If done again, user is removed, which lets TToC_BOT send messages again.

!time - Gives user the time of the draft.