export enum OPENAI_MODEL_ENGINE {
  ChatGPT3 = 'text-davinci-003'
}

export enum PEPA_STORAGE_KEYS {
  EMOJIS = 'pepaEmojis',
  STICKERS = 'pepaStickers'
}

export enum PEPA_CHAT_KEYS {
  MENTIONED = 'IS_MENTIONED',
  FULL_TILT_IGNORE = 'FULL_TILT_IGNORE',
  LAST_MESSAGE_AT = 'LAST_MESSAGE_AT',
}

export enum PEPA_TRIGGER_FLAG {
  TEST = 'TEST',
  EMOJI = 'EMOJI',
  MESSAGE = 'MESSAGE',
  NEW_YEAR = 'NEW_YEAR',
  LOOT_CLOWN_CHEST = 'LOOT_CLOWN_CHEST',
  ANY_GOOD_LOOT = 'ANY_GOOD_LOOT',
  TIME_TO_RAID_HONEY = 'YES_HONEY',
  RAID_TRIGGER_HAPPY = 'ARE_YOU_NOT_ENTERTAINED',
  DEPLETE_MYTHIC_KEY = 'DEPLETE_MYTHIC_KEY',
  POST_MEME = 'POST_MEME',
  EMPTY = 'EMPTY'
}
