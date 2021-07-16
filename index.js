const dotenv = require("dotenv")

dotenv.config()

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const Filter = require('bad-words'),
filter = new Filter();
const util = require("./util");

client.login(process.env.TOKEN);

client.on('message', async message => {
	// Voice only works in guilds, if the message does not come from a guild,
	// we ignore it
	if (!message.guild) return;
	if (message.author.id == client.user.id ) return;

	if (message.channel.name == "gpt-question-proposition") {
		


		if (message.content.length <= 30) {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('New Proposition')
			// Set the color of the embed
			.setColor('#57F287')
			// Set the main content of the embed
			.setDescription(`A new Question from: ${message.author.username}#${message.author.discriminator}` )

			.setFooter("Bot made by LESALOON#1956. Powered by Open IA GPT-3")

			.addField("The Question:", filter.clean(message.content));
			
			message.channel.send(embed);

		} else {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('ERROR')
			// Set the color of the embed
			.setColor('#ED4245')
			// Set the main content of the embed
			.setDescription('Question cant be more than 30 character long');
			// Send the embed to the same channel as the message
			try {
				message.author.dmChannel.send(`<@${message.author.id}>`,embed);
			} catch (error) {
				message.channel.send(`<@${message.author.id}>`,embed);				
			}
		}
		
		
		message.delete()
	}
	
});


function AskRoutine() {
	
	// get the message w/ the most upvote
	// delet it
	// ask GTP3
	// send the message in the gtp3 responce chanel
}

setInterval(() => {
	AskRoutine()
}, 60*100) 
// one day 24*60*60*100
// 12 h = 12*60*60*100
// 6 h = 6*60*60*100
// 3 h = 3*60*60*100