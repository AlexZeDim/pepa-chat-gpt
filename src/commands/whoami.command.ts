import { Interaction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { EmbedBuilder } from 'discord.js';
import { Octokit } from 'octokit';
import { ICommand } from '../types';

export const Whoami: ICommand = {
  name: 'whoami',
  description: 'Show creation info',
  guildOnly: true,
  slashCommand: new SlashCommandBuilder()
    .setName('whoami')
    .setDescription('Show creation info'),

  async executeInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    try {
      const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
      });

      const rainyRepo = {
        owner: 'alexzedim',
        repo: 'pepa-chatgpt',
      };

      const { data: repo } = await octokit.request("GET /repos/{owner}/{repo}", rainyRepo);
      const { data: contributors } = await octokit.request("GET /repos/{owner}/{repo}/contributors", rainyRepo);

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(repo.full_name)
        .setURL(repo.html_url)
        .setDescription(repo.description)
        .setTimestamp(new Date(repo.created_at))
        .setFooter({ text: 'Managed & operated by CMNW', iconURL: 'https://i.imgur.com/OBDcu7K.png' });

      const [topContributor] = contributors;

      embed.setThumbnail(topContributor.avatar_url);

      for (const { login, url, contributions } of contributors) {
        embed.addFields({ name: `${contributions}`, value: `[${login}](${url})`, inline: true })
      }

      await interaction.reply({ embeds: [ embed ], ephemeral: false });
    } catch (errorOrException) {
      console.error(errorOrException);
      await interaction.reply({
        content: errorOrException.message,
        ephemeral: true,
      });
    }
  }
}
