const dotenv = require("dotenv")

dotenv.config()

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const Filter = require('bad-words'),
filter = new Filter();

client.login(process.env.TOKEN);

client.on('message', async message => {
	// Voice only works in guilds, if the message does not come from a guild,
	// we ignore it
	if (!message.guild) return;


	if (message.channel.name == "gpt-question-proposition") {
		if (message.content.length <= 30) {
			console.log("New proposition :", filter.clean(message.cleanContent))
		} else {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('ERROR')
			// Set the color of the embed
			.setColor('#ED4245')
			// Set the main content of the embed
			.setDescription('Question cant be more than 30 character long');
			// Send the embed to the same channel as the message
			message.channel.send(embed);
		}
		
		
		message.delete()
	}
	
});