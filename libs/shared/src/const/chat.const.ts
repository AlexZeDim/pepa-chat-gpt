import { Collection } from 'discord.js';

export const weekdays = [
  "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье",
];

export const tags = new Collection([
  [1, 'клоуны'],
  [2, 'кловны'],
  [3, 'монки'],
  [4, 'котики'],
  [5, 'душнилы'],
  [6, 'чумбы'],
  [7, 'ребзя'],
  [8, 'терпилы'],
]);

export const wake = new Collection([
  [1, 'динь динь динь, время'],
  [2, 'динь динь динь'],
  [3, 'пора'],
  [4, 'так'],
]);

export const raid = new Collection([
  [1, 'трейдить гир'],
  [2, 'осчастливить'],
  [3, 'унижаться'],
  [4, 'вайпаться'],
]);

export const traders = new Collection([
  [1, 'девочкам-стримершам'],
  [2, 'гму'],
  [3, 'подружке гма'],
  [4, 'рлу'],
  [5, 'подруге рла'],
  [6, 'баеру'],
  [7, 'френдслотику'],
  [8, 'гильд-мейтов'],
  [9, 'френдам'],
  [10, 'пугам'],
]);

export const intro = new Collection([
  [1, 'Ну што,'],
  [2, 'Уважаемые'],
  [3, 'Чо'],
]);

export const chest = new Collection([
  [1, 'кому што надропалось из сундука?'],
  [2, 'кому что упало?'],
  [3, 'норм сыплет?'],
]);

export const baseline = new Collection([
  [1, 'Не ну это'],
  [2, 'Реально'],
]);

export const variation = new Collection([
  [1, 'гг'],
  [2, 'база'],
  [3, 'кринж'],
]);

export const tier = new Collection([
  [1, 'в волте'],
  [2, 'в хранилище'],
  [3, 'на разагеш'],
  [3, 'на праймал консулах'],
]);


export const corpus = {

  raiding: new Collection<number, Collection<number, string>>([
    [1, wake],
    [2, tags],
    [3, raid],
    [4, tier],
    [10, traders],
    [11, new Collection([
      [1, 'своего рла'] ])
    ],
    [12, new Collection([
      [1, 'перед боссами'],
      [2, 'перед рл-ом'],
      [3, 'с пугами'],
    ])],
    [13, new Collection([
      [1, 'с пугами'],
      [2, 'с *френдами*'],
      [3, 'с баерами'],
    ])],
  ]),

  media: new Collection<number, string>([
    [1, 'https://media.giphy.com/media/1Q9nERoTImXwuLq4HV/giphy.mp4'],
    [2, 'https://media.giphy.com/media/hVF5yk66RUWl3VhjTx/giphy.mp4'],
    [3, 'https://media.giphy.com/media/aegZ87q5C0oTVvjozd/giphy.mp4'],
    [4, 'https://media.giphy.com/media/ayb6gKMmX9JDX0hLRU/giphy.mp4'],
    [5, 'https://media.giphy.com/media/7z1X6zxrxsOqzoZZT2/giphy.mp4'],
    [6, 'https://media.giphy.com/media/DQL2lD8CoCsfn1uQtD/giphy.mp4'],
    [7, 'https://media.giphy.com/media/4UNTtS4FcTKhF3K39c/giphy.mp4'],
    [8, 'https://media.giphy.com/media/cy6BlXT1TpYWKzjhlV/giphy.mp4']
  ]),

  chest: new Collection<number, Collection<number, string>>([
    [1, intro],
    [2, tags],
    [3, chest],
  ]),

  neutral: new Collection<number, Collection<number, string>>([
    [1, baseline],
    [2, variation],
  ]),

  call: new Collection<number, string>([
    [1, 'добрику'],
    [2, 'яддеру'],
    [3, 'скифулу'],
  ]),

  loot: new Collection<number, Collection<number, string>>([
    [1, new Collection([
      [1, 'анлаки бро'],
      [2, '... рот этого казино'],
      [3, 'посимить там себя не забудь'],
      [4, 'понятно все с тобой'],
    ])],
    [2, new Collection([
      [1, 'бис'],
      [2, 'норм сыплет'],
      [3, 'го посимим'],
      [4, 'время крутить'],
    ])],
  ]),

  backoff: new Collection<number, string>([
    [1, 'ой всё!'],
    [2, 'ты оставил меня без слов'],
    [3, 'инвайтят в кеич, потом поговорим'],
    [4, 'френды зовут на буст, бб бро'],
    [4, 'у нас тут пуш намечается и без клоунов как ты!'],
    [5, 'надо поесть, брб афк'],
    [6, 'соре, мне надо гайд по монкам написать'],
    [7, 'тут бис дропнулся ща засимлю'],
    [8, 'напишу модеру и она тебя забанит'],
    [9, 'я обиделся'],
    [10 , 'чот устал@пойду прилягу'],
    [11 , 'мои мозги перегрелись'],
    [12 , 'пацаны зовут в качалку'],
    [13 , 'ща, жим пресса сделаю'],
    [14 , 'убегаю на треню, соре'],
  ]),

  hardcore: new Collection<number, string>([
    [1, 'на свои логи теребонькаешь, да?'],
    [2, 'логи себе крутишь, вот вы и вайпаетесь'],
    [3, 'ну што, норм лут сыплет?'],
    [4, 'что там по бест-пулу?'],
    [5, 'в зал славы - твердо и чотко?'],
    [6, 'ну как, попушили?'],
    [7, 'деплитнул уже свою двадцатку?'],
    [8, 'кидай в игнор этих клоунов, го пампить'],
    [9, 'фласку не забудь выпить'],
    [10, 'с препота пуль, под блом'],
    [11, 'тринькет прожми'],
  ]),

  keys: new Collection<number, Collection<number, string>>([
    [1, new Collection([
      [1, 'деплитать'],
      [2, 'дебустить'],
      [3, 'пушить'],
      [4, 'ломать'],
    ])],
  ]),
}
