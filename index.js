const dotenv = require("dotenv")

dotenv.config()

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const Filter = require('bad-words'),
filter = new Filter();
const util = require("./util");

client.login(process.env.TOKEN);

client.on('message', async message => {
	// if the message does not come from a guild,
	// we ignore it
	if (!message.guild) return;
	// if the message is from a bot we ignore it
	if (message.author.bot == true ) return;

	if (message.channel.name == "gpt-question-proposition") {
		
		if (message.content == process.env.PREFIX+"rool") {
			
			message.delete()
			AskRoutine(message.guild)
			return
		}


		if (message.content.length <= 30) {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('New Proposition')
			// Set the color of the embed
			.setColor(util.Colors.GREEN)
			// Set the main content of the embed
			.setDescription(`A new Question from: ${message.author.username}#${message.author.discriminator}` )
			// Set the footer of the embed
			.setAuthor(client.user.username, client.user.avatarURL())
			.setFooter("Powered by Open IA GPT-3")
			// add a Field named "The Question"
			.setTimestamp()
			.addField("The Question:", filter.clean(message.content))
			.addField("Inapropriate Question ?", 
			"If you think the question above is inappropriate (politics / controvertial subject / bad word / nsfw ) or could provoke an inappropriate response please refer immediately to an administrator");
			(await message.channel.send(embed)).react(util.Emojis.CHECK);

		} else {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('ERROR')
			// Set the color of the embed
			.setColor(util.Colors.RED)
			// Set the main content of the embed
			.setDescription('Question cant be more than 30 character long')
			.setAuthor(client.user.username, client.user.avatarURL())
			.setFooter("Powered by Open IA GPT-3");
			try {
				message.author.dmChannel.send(`<@${message.author.id}>`,embed);
			} catch (error) {
				console.log("Too long of a question",error);
			}
		}
		
		
		message.delete()
	}
	
});


function AskRoutine(guild) {
	console.log(Math.round(process.uptime()) + "s : routining on guilds named:", guild.name);

	const channel = guild.channels.cache.find( channel => channel.name == "gpt-question-proposition" )

	channel.messages.fetch().then(messages => {
		getHighestReactionAmount(messages, util.Emojis.CHECK);
	})
	// get the message w/ the most upvote
	// delet it
	// ask GTP3
	// send the message in the gtp3 responce chanel
}

function getHighestReactionAmount(messages, reaction) {
	let TopReaction = 0;
	let TopMsg;
	messages.map( message => {
		if (TopMsg == null ) {
			TopMsg = message;
			TopReaction = message.reactions.cache.first().count;
			return
		}

		if(TopReaction < message.reactions.cache.first().count ) { 
			TopMsg = message;
			TopReaction = message.reactions.cache.first().count;
			return
		}
	
	});

	return { TopReaction, TopMsg }
}

setInterval(() => {
	//client.guilds.cache.map((g) => AskRoutine(g));
	
}, 6*1000) 
// one day 24*60*60*1000
// 12 h = 12*60*60*1000
// 6 h = 6*60*60*1000
// 3 h = 3*60*60*1000