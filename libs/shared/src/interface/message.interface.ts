import { MessageReference, User } from 'discord.js';

export interface MessageJobInterface {
  readonly id: string;
  readonly channelId: string;
  readonly content: string;
  readonly author: User;
  readonly reference: MessageReference;
}

export interface MessageJobResInterface {
  readonly response: string;
  readonly channelId: string;
}
