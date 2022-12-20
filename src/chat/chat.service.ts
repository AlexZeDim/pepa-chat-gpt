import { Client, Message } from 'discord.js';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import timezone from 'dayjs/plugin/timezone';
import updateLocale from 'dayjs/plugin/updateLocale';
import localeData from 'dayjs/plugin/localeData';
import locale_ru from 'dayjs/locale/ru';
import isBetween from 'dayjs/plugin/isBetween';

import {
  corpus,
  DiceInterface,
  PEPA_STORAGE_KEYS,
  PEPA_TRIGGER_FLAG,
  randInBetweenFloat,
  randInBetweenInt,
  weekdays,
} from '@app/shared';

@Injectable()
export class ChatService {
  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
  ) { }

  initDayJs() {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(weekday);
    dayjs.extend(updateLocale);
    dayjs.extend(localeData);
    dayjs.extend(isBetween);

    dayjs.tz.setDefault('Europe/Moscow');

    dayjs.locale(locale_ru);

    dayjs.updateLocale('ru', { weekdays });
  }

  async test() {
  }

  /**
   * @description Use random react with emojis between 1 and 5 reactions
   * @description for maximum user behavior
   */
  async chatPepeReaction (client: Client, message: Message, min: number, max: number) {
    const anchorRandomElement = randInBetweenInt(min, max);
    const rangeAnchorElement = randInBetweenInt(min, 4);
    const emojiPepeArrayId = await this.redisService.lrange(PEPA_STORAGE_KEYS.EMOJIS, (anchorRandomElement - rangeAnchorElement), anchorRandomElement);
    for (const emojiId of emojiPepeArrayId) {
      const emoji = await client.emojis.cache.get(emojiId);
      await message.react(emoji);
    }
  }

  /**
   * @description Don't to understand@feel it
   * @description This is vegas
   */
  async diceRollerFullHouse (
    isText: boolean = false,
    hasAttachment: boolean = false,
    isMentioned: boolean = false,
    isTest: boolean = false,
  ): Promise<DiceInterface> {
    try {
      const localTime = dayjs();
      const triggerChance = randInBetweenFloat(0, 1, 2);

      if (isTest) {
        const context = corpus.raiding.map((value, key) => {
          if (key === 4) {
            console.log(value, key);
            const index = randInBetweenInt(1 , value.size);
            console.log(index);
            const raid = value.at(index);
            console.log(raid);
            const action = corpus.raiding.get(index + 9).random();

            return `${raid} ${action}`;
          }

          if (key > 4) {
            return '';
          }

          return value.random();
        }).join(' ');

        console.log(context)

        return { flag: PEPA_TRIGGER_FLAG.TEST, context: `Привет, я Пепа` };
      }

      if (!isText && !hasAttachment && !isMentioned) {
        /**
         * @description DID YOU FORGET TO DEPLETE YOUR KEY?
         */
        if (localTime.weekday() === 1) {
          const [startJoinQueueMythicKey, endLeavePugsDepleteKey] = [
            localTime.hour(23).minute(0),
            localTime.hour(23).minute(59),
          ];

          const timeToDepleteKey = localTime.isBetween(startJoinQueueMythicKey, endLeavePugsDepleteKey);
          const isTimeToDepleteKey = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY);
          if (timeToDepleteKey && isTimeToDepleteKey) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY, 1 , 'EX', 1000 * 60 * 60 * 2);
            return { flag: PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY };
          }
        }
        /**
         * @description If Wednesday check once only!
         * @description GREAT LETTER DAY
         */
        if (localTime.weekday() === 2) {
          const [
            startLootClownChest, endLootClownChest,
            startAnyGoodLoot, endAnyGoodLoot
          ] = [
            localTime.hour(10).minute(0),
            localTime.hour(10).minute(20),
            localTime.hour(11).minute(0),
            localTime.hour(11).minute(20),
          ];

          const timeToLoot = localTime.isBetween(startLootClownChest, endLootClownChest);
          const isTimeToLootTriggered = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST);
          if (timeToLoot && isTimeToLootTriggered) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST, 1 , 'EX', 1000 * 60 * 60 * 2);
            return { flag: PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST };
          }

          const anyGoodLoot = localTime.isBetween(startAnyGoodLoot, endAnyGoodLoot);
          const isTimeAnyGoodLootTriggered = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT);
          if (anyGoodLoot && isTimeAnyGoodLootTriggered) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT, 1 , 'EX', 1000 * 60 * 60 * 2);
            return { flag: PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT };
          }
        }
        /**
         * @description Every Mon Tue Wed Thur
         * @description TIME TO RAID BABE @ YES HONEY!
         */
        if (localTime.weekday() < 4) {
          const [startRaidHoney, endRaidHoney] = [
            localTime.hour(20).minute(0),
            localTime.hour(23).minute(59),
          ];

          const raidTimeHoney = localTime.isBetween(startRaidHoney, endRaidHoney);
          const isTimeToRaidHoney = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY);
          if (raidTimeHoney && isTimeToRaidHoney) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY, 1 , 'EX', 1000 * 60 * 60 * 4);

            const context = corpus.raiding.map((value, key) => {
              if (key === 4) {
                const index = randInBetweenInt(0 , value.size);

                const raid = value.at(index);

                const action = corpus.raiding.at(index + 10).random();

                return `${raid} ${action}`;
              }
              return value.random();
            }).join(' ');

            return { flag: PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY, context };
          }
        }
      }

      if (!isText && hasAttachment && triggerChance > 0.50) {
        return { flag: PEPA_TRIGGER_FLAG.EMOJI };
      }

      if ((isText && triggerChance <= 0.12) || isMentioned) {
        return { flag: PEPA_TRIGGER_FLAG.MESSAGE };
      }

      if (isText && triggerChance >= 0.88) {
        return { flag: PEPA_TRIGGER_FLAG.EMOJI };
      }


      return { flag: PEPA_TRIGGER_FLAG.ERROR };
    } catch (e) {
      console.log(e);
      return{ flag: PEPA_TRIGGER_FLAG.ERROR };
    }
  }

  whoAmIContext (authorName: string): string[] {
    return [`${authorName}: Hiya, who are you?', 'Пепа: Hi! I am пепа. I play World of Warcraft on monk class. I like to push mythic plus, raid with friends and loot gear from weekly chest!`];
  }
}
