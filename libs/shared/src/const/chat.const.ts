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
  [6, ''],
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

export const corpus = {

  raiding: new Collection<number, Collection<number, string>>([
    [1, wake],
    [2, tags],
    [4, raid],
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
    [1, 'https://media.discordapp.net/attachments/878612342529749005/948200639920476200/3x.gif'],
    [2, 'https://cdn.discordapp.com/attachments/803140156336898068/950467930947219476/1kTjqCU.mp4'],
    [3, 'https://tenor.com/view/olyashaa-olyashaasaxon-%D0%BE%D0%BB%D1%8F%D1%88%D0%B0-%D1%87%D1%82%D0%BE-what-gif-20406193'],
    [4, 'https://tenor.com/view/%D1%81%D0%B2%D0%B8%D0%BD%D1%8F%D0%B4%D0%B6%D0%B0%D0%BA%D1%83%D0%B7%D1%96-%D1%81%D0%B2%D0%B8%D0%BD%D1%8F-%D0%B4%D0%B6%D0%B0%D0%BA%D1%83%D0%B7%D1%96-%D0%B2%D0%BE%D0%B4%D0%B0-%D1%81%D0%BC%D0%B0%D1%87%D0%BD%D0%BE%D0%B3%D0%BE-gif-26990311'],
    [5, 'https://imgur.com/LHZGEqD'],
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
    [4, 'у нас тут пуш намечается и совсем без таких клоунов как ты!'],
    [5, 'надо поесть, брб афк'],
    [6, 'соре, мне надо гайд для нимса написать'],
    [7, 'тут бис дропнулся над засимить'],
    [8, 'сейчас напишу модеру и она тебя забанит'],
    [9, 'я обиделся'],
    [10 , 'чот устал@пойду прилягу'],
    [11 , 'мои мозги перегрелись'],
  ]),

  tier: ['хранилище', 'волты'],
  keys: new Collection<number, Collection<number, string>>([
    [1, new Collection([
      [1, 'деплитать'],
      [2, 'дебустить'],
      [3, 'пушить'],
      [4, 'ломать'],
    ])],
  ]),
}
