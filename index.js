const dotenv = require("dotenv")

dotenv.config()

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const Filter = require('bad-words'),
filter = new Filter();
const util = require("./util");

const OpenAI = require('openai-api');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

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
			"If you think the question above is inappropriate (politics / controvertial subject / bad word / nsfw ) or could provoke an inappropriate response please refer immediately to an administrator",
			true);
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
				message.author.DMChannel.send(`<@${message.author.id}>`,embed);
			} catch (error) {
				console.log("Too long of a question");
			}
		}
		
		message.delete()
	}
	
});


function AskRoutine(guild) {
	console.log(Math.round(process.uptime()) + "s : routining on guilds named:", guild.name);

	const channelP = guild.channels.cache.find( channel => channel.name == "gpt-question-proposition" )

	
	channelP.messages.fetch().then(messages => {
		const message = getHighestReactionAmount(messages, util.Emojis.CHECK); // get the message w/ the most upvote
		//console.log(message.embeds[0]);
		//message.react("👍");
		
		

		// ask GTP3
		const gptResponse = openai.complete({
			engine: 'davinci',
			prompt: 
`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.

H:${message.embeds[0].fields[0].value}
A:`,
			maxTokens: 50,
			temperature: 0.9,
			topP: 1,
			presencePenalty: 0,
			frequencyPenalty: 0,
			bestOf: 1,
			n: 1,
			stream: false,
			stop: ['\n', "H:", "A:"]
		}).then((gptResponse)=> {
			console.log(gptResponse.data.choices[0].text);
			// send the message in the gtp3 responce chanel
			const channelA = guild.channels.cache.find( channel => channel.name == "gpt-answer" )
			
			const embed = new MessageEmbed()
			// Set the title of the field
			.setTitle('Responce time')
			// Set the color of the embed
			.setColor(util.Colors.BLURPLE)
			// Set the main content of the embed
			.setDescription(`This is the responce of GTP-3 on the question of : ${message.embeds[0].description.split(": ")[1]}`)
			.addField("Question: ", `${message.embeds[0].fields[0].value}`)
			.addField("Answer from GTP-3: ", `${gptResponse.data.choices[0].text}`)
			.addField("Shoking answer ?", "If you think the answer above is inappropriate (politics / controvertial subject / bad word / nsfw ) please refer immediately to an administrator and take note that GPT-3 has no filter and has learned from internet. We do not control his answer in any way")
			.setAuthor(client.user.username)
			.setFooter("Powered by Open IA GPT-3");
	
			channelA.send(embed);

			// delete all the msg in the chanel
			messages.map((m) => m.delete() );

		});
	})


	
}

function getHighestReactionAmount(messages, reaction) {
	let TopMsg;
	messages.map( message => {
		if (message.reactions == undefined ) return
		if (TopMsg == undefined ) {
			TopMsg = message;
			return
		}
		if (TopMsg == null) {
			TopMsg = message;
			return
		}
		console.log(TopMsg)
		if(TopMsg.reactions.cache.first().count < message.reactions.cache.first().count ) { 
			TopMsg = message;
			return
		}
	
	});
	if (TopMsg.reactions.cache.first().count == 1) return null
	return TopMsg
}

setInterval(() => {
	//client.guilds.cache.map((g) => AskRoutine(g));
	
}, 6*1000) 
// one day 24*60*60*1000
// 12 h = 12*60*60*1000
// 6 h = 6*60*60*1000
// 3 h = 3*60*60*1000