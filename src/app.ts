import { Client, TextChannel } from "discord.js";
import { config as env } from "dotenv";
import getFilesInDirectory from "./utils/getFilesInDirectory";
import { handlers_directory, AUTHENTICATION_MESSAGE_CHANNEL, AUTHENTICATION_MESSAGE_ID, PRODUCTION_ENV, GENERAL_CHANNEL_ID } from "./config.json";
import TwitterService from "./services/TwitterService";

const client = new Client();

if (process.env.NODE_ENV !== PRODUCTION_ENV) {
	env({
		path: "../.env"
	});
}

(async () => {
	if (process.env.DISCORD_TOKEN) {
		try {
			await client.login(process.env.DISCORD_TOKEN);
			console.log(`Successfully logged in as ${client.user?.username}`);

			const handlerFiles = await getFilesInDirectory(
				`${__dirname}/${handlers_directory}`,
				"Handler.js"
			);

			handlerFiles.forEach(handler => {
				const { default: Handler } = handler;
				const handlerInstance = new Handler();

				client.on(handlerInstance.getEvent(), handlerInstance.handle);
			});

			if (process.env.NODE_ENV === PRODUCTION_ENV) {
				const authChannel = await client.channels.fetch(AUTHENTICATION_MESSAGE_CHANNEL) as TextChannel;
				const tweetChannel = await client.channels.fetch(GENERAL_CHANNEL_ID) as TextChannel;

				await authChannel.messages.fetch(AUTHENTICATION_MESSAGE_ID);
				await TwitterService.getInstance().streamToDiscord(tweetChannel);
			}
		} catch (error) {
			console.error(error);
		}
	} else {
		throw new Error("You must supply the DISCORD_TOKEN environment variable.");
	}
})();