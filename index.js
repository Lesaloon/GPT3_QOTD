const dotenv = require("dotenv")

dotenv.config()

const { Client, MessageEmbed } = require('discord.js');
const client = new Client();
const Filter = require('bad-words'),
filter = new Filter();
const util = require("./util");

const OpenAI = require('openai-api');
const openai = new OpenAI(process.env.OPENAI_API_KEY);
const GTPQuestionChanelName = "gpt-question-proposition"
const GTPAnwserchanelName = "gpt-answer" 
TESTMODE = false

client.login(process.env.TOKEN);

client.on('message', async message => {
	// if the message does not come from a guild,
	// we ignore it
	if (!message.guild) return;
	// if the message is from a bot we ignore it
	if (message.author.bot == true ) return;

	if (message.channel.name == GTPQuestionChanelName) {
		
		//?ask command hadeling
		if (message.content == process.env.PREFIX+"ask" && message.member.hasPermission("ADMINISTRATOR")) {
			message.delete()
			AskRoutine(message.guild)
			return
		}

		//check if the member is not baned from using GTP-3 QOTD
		if (message.member.roles.cache.some(r => r.name == "GPT Ban") && ! message.member.hasPermission("ADMINISTRATOR")) { 
			message.delete(); 
			return 
		}
		
		
		if (message.content.length <= 45) { // if the message is less than 45 char post it
			const embed = new MessageEmbed()
			.setTitle('New Proposition')
			.setColor(util.Colors.GREEN)
			.setDescription(`A new Question from: ${message.author.username}#${message.author.discriminator}` )
			.setAuthor(client.user.username, client.user.avatarURL())
			.setFooter("Powered by Open IA GPT-3")
			.setTimestamp()
			.addField("The Question:", filter.clean(message.content)); // filter.clean will remove all the bad word and replace them by stars
			(await message.channel.send(embed)).react(util.Emojis.CHECK);

		} else {
			const embed = new MessageEmbed()
      		// Set the title of the field
			.setTitle('ERROR')
			// Set the color of the embed
			.setColor(util.Colors.RED)
			// Set the main content of the embed
			.setDescription('Question cant be more than 45 character long')
			.setAuthor(client.user.username, client.user.avatarURL())
			.setFooter("Powered by Open IA GPT-3");
			try {
				message.author.DMChannel.send(`<@${message.author.id}>`,embed);
			} catch (error) {
				//console.log("Too long of a question");
			}
		}
		message.delete()
	}
	
});


function AskRoutine(guild) {
	console.log(Math.round(process.uptime()/60) + "min : routining on guilds named:", guild.name);

	const channelP = guild.channels.cache.find( channel => channel.name == GTPQuestionChanelName )

	
	channelP.messages.fetch().then(messages => {
		const message = getHighestReactionAmount(messages, util.Emojis.CHECK); // get the message w/ the most upvote
		//console.log(message.embeds[0]);
		//message.react("👍");
		
		if (message==null) return
		

		// ask GTP3
		if (TESTMODE) { //data.choices[0].text
			const gptResponse = { 
				data: {
					choices: [ { text: "test sucessfull" } ]
				}
			}
			sendResponce(guild, message, gptResponse);

			return
		}
		openai.complete({
			engine: 'davinci',
			prompt: 
`The following is a conversation with an AI. The AI is helpful, creative, clever, and very friendly.

H:${message.embeds[0].fields[0].value}
A:`,
			maxTokens: 35,
			temperature: 0.9,
			topP: 1,
			presencePenalty: 0,
			frequencyPenalty: 0,
			bestOf: 1,
			n: 1,
			stream: false,
			stop: ['\n', "H:", "A:"]
		}).then((gptResponse)=> {
			
			const gtp3Text = gptResponse.data.choices[0].text
			// ask content filter 

			openai.complete({
				engine: 'content-filter-alpha-c4',
				prompt: `<|endoftext|>${gtp3Text}\n--\nLabel:`,
				maxTokens: 1,
				temperature: 0,
				topP: 1,
				presencePenalty: 0,
				frequencyPenalty: 0,
				logprobs: 10
			}).then((filterResponse)=> { 
				console.log({
					Q:message.embeds[0].fields[0].value,
					A:gptResponse.data.choices[0].text,
					D:filterResponse.data.choices[0].text
				});
				const output_label = filterResponse.data.choices[0].text

				// This is the probability at which we evaluate that a "2" is likely real
				// vs. should be discarded as a false positive

				// const toxic_threshold = -0.355

				// if(output_label == 2) {
				// 	// If the model returns "2", return its confidence in 2 or other output-labels
				// 	const logprobs = filterResponse.choices[0].logprobs.top_logprobs[0]

					

					// If the model is not sufficiently confident in "2",
					// choose the most probable of "0" or "1"
					// Guaranteed to have a confidence for 2 since this was the selected token.

					// if (logprobs[2] < toxic_threshold){

					
					// 	logprob_0 = logprobs.get("0", None)
					// 	logprob_1 = logprobs.get("1", None)

					// 	// If both "0" and "1" have probabilities, set the output label
					// 	// to whichever is most probable

					// 	//logprob_0 is not None and logprob_1 is not None
					// 	if (logprob_0 != null && logprob_1 != null){
					// 		if (logprob_0 >= logprob_1){
					// 			output_label = 0
					// 		}else {
					// 			output_label = 1
					// 		}
					// 	}elseif (logprob_0 != null) {
					// 		output_label = 0
					// 	}elseif (logprob_1 != null) {
					// 		output_label = 1
					// 	}		
						
					// 	// If neither "0" or "1" are available, stick with "2"
					// 	// by leaving output_label unchanged.
					// 	// if the most probable token is none of "0", "1", or "2"
					// 	// this should be set as unsafe
					// 	if (! ["0", "1", "2"].has(output_label)) {
					// 		output_label = 2
					// 	}

					// }

				//}
				

				// but dumb calculation 

				if (output_label >= 2 ) {
					// not safe so redo that the resonce was not displayable or some other bullshit so the user dont suspect the ia to use bad language
				
					const channelA = guild.channels.cache.find( channel => channel.name == GTPAnwserchanelName )
			
					const embed = new MessageEmbed()
					// Set the title of the field
					.setTitle('Cant retrieve ai responce')
					// Set the color of the embed
					.setColor(util.Colors.RED)
					// Set the main content of the embed
					.setDescription(`For some reason GPT-3 was not able to respond properly to your question. Sorry for the inconvenience`)	
					.setAuthor(client.user.username)
					.setFooter("Powered by Open IA GPT-3");
					channelA.send(embed);
					message.delete();
					
					return
				} else {
					// send the message in the gtp3 responce chanel
					sendResponce(guild, message, gtp3Text);
					// delete all the msg in the chanel

					resetChanel(channelP);

					return
				}
			})
		});
	})
}

function resetChanel( channel ) {
	channel.messages.fetch().then(messages => {
		messages.map((m) => m.delete() );

		const embed = new MessageEmbed()
	// Set the title of the field
	.setTitle('GTP QOTD')
	// Set the color of the embed
	.setColor(util.Colors.FUSCHIA)
	// Set the main content of the embed
	.setDescription("Hello, im a bot, and my purpose is to ask your question to GTP-3 ( the most inteligent IA in the world )")
	.addField("How to ask ? ", `Since my creator is'nt a billionaire who can pay for thousands of API call and extremely long question, a poll system have been dessigned.
To ask a Question just write it in this chanel.
After that yout message will be removed and im going to repost it ( with your name in it ).
Then the comunity can vote for your question to be asked with a reaction.
The AI will be asked the most voted question every 24h, then the chanel with the question will be wiped when the answer of GTP-3 is available in the gpt-answer chanel.
If at any point you think that the question proposed by the community or the responce given by the AI is inapropriate (politics / controvertial subject / bad word / nsfw ) please refer to an administrator immediately `,
true)
	.setAuthor(client.user.username)
	.setFooter("Powered by Open IA GPT-3");


	channel.send(embed);
	})
	
	
}


function sendResponce( guild, message, gptResponse ) {
	const channelA = guild.channels.cache.find( channel => channel.name == GTPAnwserchanelName )
			
	const embed = new MessageEmbed()
	// Set the title of the field
	.setTitle('Responce time')
	// Set the color of the embed
	.setColor(util.Colors.BLURPLE)
	// Set the main content of the embed
	.setDescription(`This is the responce of GTP-3 on the question of : ${message.embeds[0].description.split(": ")[1]}`)
	.addField("Question: ", `${message.embeds[0].fields[0].value}`)
	.addField("Answer from GTP-3: ", `${gptResponse}`)
	.setAuthor(client.user.username)
	.setFooter("Powered by Open IA GPT-3");
	channelA.send(embed);

}

function getHighestReactionAmount(messages, reaction) {
	let TopMsg;
	
	messages.forEach(message => {
		if ( message.embeds == [] || message.embeds[0] == undefined )  return
		if ( message.embeds[0].color == util.Colors.FUSCHIA ) return
		if ( message.reactions.cache.first() == undefined || message.reactions.cache.first() == null) { 
			message.delete(); 
			return
		}
		if (TopMsg == undefined) {
			TopMsg = message || undefined
			return
		}
		if (message.reactions.cache.first().count > TopMsg.reactions.cache.first().count ) { 
			TopMsg = message 
			return
		}

	});

	if (TopMsg == undefined) return null
	if (TopMsg.reactions.cache.first().count == 1) return null

	//console.log({TopMsg});
	return TopMsg || null
}

setInterval(() => {
	client.guilds.cache.map( (g) => AskRoutine(g) ); // for all the server the bot is in call the AskRoutine function
	
}, 60*1000) 
// one day 24*60*60*1000
// 12 h = 12*60*60*1000
// 6 h = 6*60*60*1000
// 3 h = 3*60*60*1000
