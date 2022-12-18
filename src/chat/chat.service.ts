import { Client, Message } from 'discord.js';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { PEPA_STORAGE_KEYS, PEPA_TRIGGER_FLAG, randInBetweenFloat, randInBetweenInt } from '@app/shared';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import weekday from 'dayjs/plugin/weekday';
import timezone from 'dayjs/plugin/timezone';
import updateLocale from 'dayjs/plugin/updateLocale';
import localeData from 'dayjs/plugin/localeData';
import locale_ru from 'dayjs/locale/ru';
import isBetween from 'dayjs/plugin/isBetween';

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

    dayjs.updateLocale('ru', {
      weekdays: [
        "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье",
      ]
    });
  }

  /**
   * @description Use random react with emojis between 1 and 5 reactions
   * @description for maximum user behavior
   */
  async chatPepeReaction (client: Client, message: Message, min: number, max: number) {
    const anchorRandomElement = randInBetweenInt(min, max);
    const rangeAnchorElement = randInBetweenInt(min, 5);
    const emojiPepeArrayId = await this.redisService.lrange(PEPA_STORAGE_KEYS.EMOJIS, (anchorRandomElement - rangeAnchorElement), anchorRandomElement);
    for (const emojiId of emojiPepeArrayId) {
      const emoji = await client.emojis.cache.get(emojiId);
      await message.react(emoji);
    }
  }

  async diceRollerFullHouse (
    isText: boolean = false,
    hasAttachment: boolean = false,
    isMentioned: boolean = false,
  ): Promise<PEPA_TRIGGER_FLAG> {
    try {
      const dayjsLocal = dayjs();
      const triggerChance = randInBetweenFloat(0, 1, 2);

      if (!isText && !hasAttachment && !isMentioned) {
        /**
         * @description DID YOU FORGET TO DEPLETE YOUR KEY?
         */
        if (dayjsLocal.weekday() === 1) {
          const [startJoinQueueMythicKey, endLeavePugsDepleteKey] = [
            dayjs().hour(23).minute(0),
            dayjs().hour(23).minute(59),
          ];

          const timeToDepleteKey = dayjsLocal.isBetween(startJoinQueueMythicKey, endLeavePugsDepleteKey);
          const isTimeToDepleteKey = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY);
          if (timeToDepleteKey && isTimeToDepleteKey) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY, 1 , 'EX', 1000 * 60 * 60 * 2);
            return PEPA_TRIGGER_FLAG.DEPLETE_MYTHIC_KEY;
          }
        }
        /**
         * @description If Wednesday check once only!
         * @description GREAT LETTER DAY
         */
        if (dayjsLocal.weekday() === 2) {
          const [
            startLootClownChest, endLootClownChest,
            startAnyGoodLoot, endAnyGoodLoot
          ] = [
            dayjs().hour(10).minute(0),
            dayjs().hour(10).minute(20),
            dayjs().hour(11).minute(0),
            dayjs().hour(11).minute(20),
          ];

          const timeToLoot = dayjsLocal.isBetween(startLootClownChest, endLootClownChest);
          const isTimeToLootTriggered = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST);
          if (timeToLoot && isTimeToLootTriggered) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST, 1 , 'EX', 1000 * 60 * 60 * 2);
            return PEPA_TRIGGER_FLAG.LOOT_CLOWN_CHEST;
          }

          const anyGoodLoot = dayjsLocal.isBetween(startAnyGoodLoot, endAnyGoodLoot);
          const isTimeAnyGoodLootTriggered = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT);
          if (anyGoodLoot && isTimeAnyGoodLootTriggered) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT, 1 , 'EX', 1000 * 60 * 60 * 2);
            return PEPA_TRIGGER_FLAG.ANY_GOOD_LOOT;
          }
        }
        /**
         * @description Every Mon Tue Wed Thur
         * @description TIME TO RAID BABE @ YES HONEY!
         */
        if (dayjsLocal.weekday() === 0 || dayjsLocal.weekday() === 1 || dayjsLocal.weekday() === 3 || dayjsLocal.weekday() === 2) {
          const [startRaidHoney, endRaidHoney] = [
            dayjs().hour(20).minute(0),
            dayjs().hour(23).minute(59),
          ];

          const raidTimeHoney = dayjsLocal.isBetween(startRaidHoney, endRaidHoney);
          const isTimeToRaidHoney = !!await this.redisService.exists(PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY);
          if (raidTimeHoney && isTimeToRaidHoney) {
            await this.redisService.set(PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY, 1 , 'EX', 1000 * 60 * 60 * 4);
            return PEPA_TRIGGER_FLAG.TIME_TO_RAID_HONEY;
          }
        }
      }

      if (!isText && hasAttachment && triggerChance > 0.50) {
        return PEPA_TRIGGER_FLAG.EMOJI;
      }

      if ((isText && triggerChance <= 0.12) || isMentioned) {
        return PEPA_TRIGGER_FLAG.MESSAGE;
      }

      if (isText && triggerChance >= 0.88) {
        return PEPA_TRIGGER_FLAG.EMOJI;
      }
    } catch (e) {
      console.log(e);
      return PEPA_TRIGGER_FLAG.ERROR;
    }
  }

  whoAmIContext (authorName: string): string[] {
    return [`${authorName}: Привет, кто ты?', 'Пепа: Привет! Я - Пепа. Я люблю играть в World of Warcraft за монаха. Ходить в ключи и лутать шмотки.`];
  }
}
