import { Interaction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';

export interface ICommand {
  readonly name: string;

  readonly description: string;

  readonly guildOnly: boolean;

  readonly slashCommand: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

  executeInteraction(interactionArgs: Interaction): Promise<void>;
}
